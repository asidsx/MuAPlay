package com.muaplay.music;

import android.app.*;
import android.content.*;
import android.content.pm.ServiceInfo;
import android.os.*;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

public class AudioForegroundService extends Service {
    public static final String CHANNEL_ID = "muaplay_playback_channel";
    public static final int NOTIFICATION_ID = 1001;

    public static final String ACTION_PLAY = "com.muaplay.music.ACTION_PLAY";
    public static final String ACTION_PAUSE = "com.muaplay.music.ACTION_PAUSE";
    public static final String ACTION_TOGGLE = "com.muaplay.music.ACTION_TOGGLE";
    public static final String ACTION_NEXT = "com.muaplay.music.ACTION_NEXT";
    public static final String ACTION_PREV = "com.muaplay.music.ACTION_PREV";
    public static final String ACTION_UPDATE = "com.muaplay.music.ACTION_UPDATE";

    private static AudioForegroundService instance;
    private MediaSessionCompat mediaSession;
    
    private String currentTitle = "MuAPlay Плеер";
    private String currentArtist = "Киберпанк аудио";
    private String currentAlbum = "MuAPlay Lossless";
    private boolean isPlaying = false;
    private long duration = 180;
    private long position = 0;

    public static void updateMediaInfo(Context ctx, String title, String artist, String album, boolean isPlaying, long durationSec, long positionSec) {
        Intent intent = new Intent(ctx, AudioForegroundService.class);
        intent.setAction(ACTION_UPDATE);
        intent.putExtra("title", title);
        intent.putExtra("artist", artist);
        intent.putExtra("album", album);
        intent.putExtra("isPlaying", isPlaying);
        intent.putExtra("duration", durationSec);
        intent.putExtra("position", positionSec);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ctx.startForegroundService(intent);
        } else {
            ctx.startService(intent);
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        createChannel();
        initMediaSession();
    }

    private void initMediaSession() {
        mediaSession = new MediaSessionCompat(this, "MuAPlay_MediaSession");
        mediaSession.setFlags(MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS | MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS);
        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override public void onPlay() { sendAction("play"); }
            @Override public void onPause() { sendAction("pause"); }
            @Override public void onSkipToNext() { sendAction("next"); }
            @Override public void onSkipToPrevious() { sendAction("prev"); }
            @Override public void onRewind() { sendAction("prev"); }
            @Override public void onFastForward() { sendAction("next"); }
            @Override public void onSeekTo(long pos) { sendAction("seek:" + pos); }
        });
        mediaSession.setActive(true);
        updatePlaybackState();
    }

    private void sendAction(String action) {
        if (MainActivity.getInstance() != null) {
            MainActivity.getInstance().dispatchAudioAction(action);
        }
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "MuAPlay Фоновое воспроизведение", NotificationManager.IMPORTANCE_LOW);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            ch.setShowBadge(false);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    private void updatePlaybackState() {
        if (mediaSession == null) return;
        long actions = PlaybackStateCompat.ACTION_PLAY | PlaybackStateCompat.ACTION_PAUSE |
                       PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS |
                       PlaybackStateCompat.ACTION_PLAY_PAUSE | PlaybackStateCompat.ACTION_SEEK_TO;
        int state = isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;

        PlaybackStateCompat playbackState = new PlaybackStateCompat.Builder()
            .setActions(actions)
            .setState(state, position * 1000L, 1.0f)
            .build();
        mediaSession.setPlaybackState(playbackState);

        MediaMetadataCompat metadata = new MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
            .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, currentAlbum)
            .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, duration * 1000L)
            .build();
        mediaSession.setMetadata(metadata);
    }

    private Notification buildNotification() {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pContent = launchIntent != null ? PendingIntent.getActivity(this, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE) : null;

        Intent prevIntent = new Intent(this, AudioForegroundService.class).setAction(ACTION_PREV);
        PendingIntent pPrev = PendingIntent.getService(this, 1, prevIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
        Intent toggleIntent = new Intent(this, AudioForegroundService.class).setAction(ACTION_TOGGLE);
        PendingIntent pToggle = PendingIntent.getService(this, 2, toggleIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
        Intent nextIntent = new Intent(this, AudioForegroundService.class).setAction(ACTION_NEXT);
        PendingIntent pNext = PendingIntent.getService(this, 3, nextIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setSubText(currentAlbum != null && !currentAlbum.isEmpty() ? currentAlbum : "MuAPlay")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(pContent)
            .setOngoing(isPlaying)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(android.R.drawable.ic_media_previous, "Назад", pPrev)
            .addAction(isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play, isPlaying ? "Пауза" : "Играть", pToggle)
            .addAction(android.R.drawable.ic_media_next, "Вперед", pNext)
            .setStyle(new MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2)
                .setShowCancelButton(true)
                .setCancelButtonIntent(pToggle));
                
        return builder.build();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            String action = intent.getAction();
            if (ACTION_PREV.equals(action)) {
                sendAction("prev");
            } else if (ACTION_NEXT.equals(action)) {
                sendAction("next");
            } else if (ACTION_TOGGLE.equals(action)) {
                sendAction("toggle");
            } else if (ACTION_PLAY.equals(action)) {
                sendAction("play");
            } else if (ACTION_PAUSE.equals(action)) {
                sendAction("pause");
            } else if (ACTION_UPDATE.equals(action)) {
                currentTitle = intent.getStringExtra("title");
                if (currentTitle == null || currentTitle.isEmpty()) currentTitle = "MuAPlay Плеер";
                currentArtist = intent.getStringExtra("artist");
                if (currentArtist == null || currentArtist.isEmpty()) currentArtist = "Cyberpunk Audio";
                currentAlbum = intent.getStringExtra("album");
                isPlaying = intent.getBooleanExtra("isPlaying", false);
                duration = intent.getLongExtra("duration", 180);
                position = intent.getLongExtra("position", 0);
                updatePlaybackState();
            }
        }

        Notification notification = buildNotification();
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.release();
        }
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent intent) { return null; }
}
