import React, { useState } from 'react';
import { Edit3, Image, Sparkles, X, Check, Upload, Disc } from 'lucide-react';
import { Track } from '../types/music';
import { fetchMissingAlbumArt } from '../services/metadataScanner';
import { saveCoverCache } from '../services/audioStorage';
import { CyberCoverImage } from './CyberCoverImage';

interface TagEditorModalProps {
  isOpen: boolean;
  track: Track | null;
  onClose: () => void;
  onSave: (updatedTrack: Track) => void;
}

export const TagEditorModal: React.FC<TagEditorModalProps> = ({
  isOpen,
  track,
  onClose,
  onSave,
}) => {
  if (!isOpen || !track) return null;

  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist);
  const [album, setAlbum] = useState(track.album || '');
  const [genre, setGenre] = useState(track.genre || '');
  const [year, setYear] = useState(track.year || '');
  const [coverUrl, setCoverUrl] = useState(track.coverUrl || '');
  const [isSearchingCover, setIsSearchingCover] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setCoverUrl(result);
      await saveCoverCache(track.id, result);
      setStatusMessage('Обложка загружена из файла');
      setTimeout(() => setStatusMessage(null), 2000);
    };
    reader.readAsDataURL(file);
  };

  const handleAutoSearchCover = async () => {
    setIsSearchingCover(true);
    setStatusMessage('Поиск обложки в базе...');
    try {
      const foundCover = await fetchMissingAlbumArt(artist || track.artist, title || track.title, album || track.album);
      if (foundCover) {
        setCoverUrl(foundCover);
        await saveCoverCache(track.id, foundCover);
        setStatusMessage('Обложка найдена и применена!');
      } else {
        setStatusMessage('Обложка не найдена в онлайн-каталогах');
      }
    } catch {
      setStatusMessage('Ошибка при поиске обложки');
    } finally {
      setIsSearchingCover(false);
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Track = {
      ...track,
      title: title.trim() || track.title,
      artist: artist.trim() || track.artist,
      album: album.trim() || track.album,
      genre: genre.trim() || undefined,
      year: year.trim() || undefined,
      coverUrl: coverUrl.trim() || undefined,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-mono animate-in fade-in duration-200">
      <div className="bg-[#100308] border-2 border-[#FF1A3C] rounded-2xl p-4 sm:p-5 w-full max-w-md space-y-4 shadow-[0_0_35px_rgba(255,26,60,0.5)] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#FF1A3C]/30 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#FF1A3C]/20 border border-[#FF1A3C]/50 text-[#FF1A3C]">
              <Edit3 className="w-4 h-4 text-[#FF1A3C]" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white tracking-wider">
                [ РЕДАКТОР ТЕГОВ ID3 ]
              </h3>
              <span className="text-[9px] text-[#883344] block">
                Изменение метаданных аудиофайла и обложки
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#883344] hover:text-[#FF1A3C] hover:bg-[#FF1A3C]/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-0">
          {/* Cover Art Preview & Quick Edit Row */}
          <div className="flex items-center gap-3 bg-[#18040C] p-2.5 rounded-xl border border-[#FF1A3C]/30">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#0A0206] shrink-0 border border-[#FF1A3C]/60 shadow-md">
              <CyberCoverImage
                src={coverUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-1.5 min-w-0">
              <span className="text-[9px] text-[#FF4D6D] uppercase font-bold block">
                ОБЛОЖКА АЛЬБОМА
              </span>

              <div className="flex items-center gap-1.5 flex-wrap">
                <label className="px-2 py-1 bg-[#100308] hover:bg-[#20040E] border border-[#FF1A3C]/40 text-[#FF8095] rounded-lg text-[9px] font-bold cursor-pointer transition-colors flex items-center gap-1">
                  <Upload className="w-3 h-3 text-[#FF1A3C]" />
                  <span>ИЗ ФАЙЛА</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleAutoSearchCover}
                  disabled={isSearchingCover}
                  className="px-2 py-1 bg-[#100308] hover:bg-[#20040E] border border-[#00E5FF]/40 text-[#00E5FF] rounded-lg text-[9px] font-bold transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-[#00E5FF]" />
                  <span>{isSearchingCover ? 'ПОИСК...' : 'АВТОПОИСК'}</span>
                </button>
              </div>

              {statusMessage && (
                <span className="text-[8px] text-[#00E5FF] block animate-pulse">
                  {statusMessage}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] text-[#FF4D6D] block mb-1">
              НАЗВАНИЕ ТРЕКА (TITLE)
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#080104] border border-[#FF1A3C]/40 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#552233] focus:outline-none focus:border-[#FF1A3C]"
            />
          </div>

          {/* Artist */}
          <div>
            <label className="text-[10px] text-[#FF4D6D] block mb-1">
              ИСПОЛНИТЕЛЬ (ARTIST)
            </label>
            <input
              type="text"
              required
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full bg-[#080104] border border-[#FF1A3C]/40 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#552233] focus:outline-none focus:border-[#FF1A3C]"
            />
          </div>

          {/* Album */}
          <div>
            <label className="text-[10px] text-[#FF4D6D] block mb-1">
              АЛЬБОМ (ALBUM)
            </label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              className="w-full bg-[#080104] border border-[#FF1A3C]/40 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#552233] focus:outline-none focus:border-[#FF1A3C]"
            />
          </div>

          {/* Genre & Year */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#FF4D6D] block mb-1">
                ЖАНР (GENRE)
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Cyberpunk, Synthwave"
                className="w-full bg-[#080104] border border-[#FF1A3C]/40 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#552233] focus:outline-none focus:border-[#FF1A3C]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#FF4D6D] block mb-1">
                ГОД (YEAR)
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
                className="w-full bg-[#080104] border border-[#FF1A3C]/40 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#552233] focus:outline-none focus:border-[#FF1A3C]"
              />
            </div>
          </div>

          {/* Direct Cover URL input */}
          <div>
            <label className="text-[10px] text-[#FF4D6D] block mb-1">
              URL ОБЛОЖКИ (ССЫЛКА НА ИЗОБРАЖЕНИЕ)
            </label>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://example.com/cover.jpg"
              className="w-full bg-[#080104] border border-[#FF1A3C]/40 rounded-lg px-2.5 py-1.5 text-xs text-[#00E5FF] placeholder-[#552233] focus:outline-none focus:border-[#FF1A3C] text-[11px]"
            />
          </div>

          {/* Format Info readonly badge */}
          <div className="bg-[#080104] p-2 rounded-lg border border-[#FF1A3C]/20 flex items-center justify-between text-[9px] text-[#883344]">
            <span>ФОРМАТ АУДИО: <strong className="text-white">{track.hiResInfo?.format}</strong></span>
            <span>ДЛИТЕЛЬНОСТЬ: <strong className="text-white">{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</strong></span>
            <span>LOSSLESS: <strong className={track.hiResInfo?.isLossless ? 'text-[#00FF66]' : 'text-white'}>{track.hiResInfo?.isLossless ? 'ДА' : 'НЕТ'}</strong></span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#FF1A3C]/30 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#18040C] border border-[#FF1A3C]/30 text-[#883344] rounded-lg text-[10px] font-bold hover:text-white transition-colors"
            >
              ОТМЕНА
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#FF1A3C] hover:bg-[#FF0033] text-black font-black rounded-lg text-[10px] shadow-[0_0_12px_rgba(255,26,60,0.6)] transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>СОХРАНИТЬ ТЕГИ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
