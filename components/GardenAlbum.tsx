import React, { useEffect, useMemo, useState } from 'react';
import { FamilyGardenState } from '../types';
import {
  GARDEN_SPECIES,
  GardenSpecies,
  getGardenCollectionCount,
  getGardenSpecies,
  isCooperativeBloom,
} from '../services/gardenUtils';
import { GardenPlant } from './GardenPlant';
import { Button } from './ui/Button';
import { Icons } from './Icons';

interface GardenAlbumProps {
  garden: FamilyGardenState;
  canStartNextPlant: boolean;
  onStartPlant: (speciesId: string) => void;
}

/** 真實照片放大檢視：讓孩子在野外也認得出這種植物 */
const GardenPhotoViewer: React.FC<{ species: GardenSpecies; onClose: () => void }> = ({ species, onClose }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${species.commonName}的真實照片`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bey-void/80 p-4 animate-pop"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-bey-paper p-3 custom-scrollbar md:p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-lg font-black text-bey-cyan">{species.commonName}</h4>
            <p className="text-xs font-bold italic text-bey-dim">{species.scientificName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉照片"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-bey-dim hover:bg-bey-deep hover:text-bey-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bey-cyanDark"
          >
            <Icons.X size={20} />
          </button>
        </div>

        <div className="mt-2 overflow-hidden rounded-xl bg-bey-deep">
          {failed ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 px-4 py-8 text-center">
              <Icons.ImageOff size={28} className="text-bey-dim" />
              <p className="text-sm font-normal text-bey-dim">照片載入失敗，請確認網路連線</p>
            </div>
          ) : (
            <img
              src={species.photoUrl}
              alt={`${species.commonName}（${species.scientificName}）的真實照片`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setFailed(true)}
              className="block max-h-[52vh] w-full object-contain"
            />
          )}
        </div>

        <div className="mt-2 flex items-center gap-2 rounded-xl bg-bey-deep/60 px-3 py-2">
          <div className="w-16 flex-shrink-0" aria-hidden="true">
            <GardenPlant speciesId={species.id} stage={5} />
          </div>
          <p className="text-xs font-bold leading-relaxed text-bey-ink">
            左邊是圖鑑裡的插畫，上面是野外真正的樣子。{species.identifyingFeature}
          </p>
        </div>

        <a
          href={species.photoSourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block text-right text-xs font-normal text-bey-dim hover:text-bey-cyan"
        >
          照片：{species.photoCredit}（Wikimedia Commons）↗
        </a>
      </div>
    </div>
  );
};

export const GardenAlbum: React.FC<GardenAlbumProps> = ({
  garden,
  canStartNextPlant,
  onStartPlant,
}) => {
  const suggestedSpeciesId = useMemo(() => (
    GARDEN_SPECIES.find((species) => getGardenCollectionCount(garden, species.id) === 0)?.id
      ?? GARDEN_SPECIES[0].id
  ), [garden]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(suggestedSpeciesId);
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'collected' | 'uncollected'>('all');
  const [photoSpecies, setPhotoSpecies] = useState<GardenSpecies | null>(null);
  const selectedSpecies = getGardenSpecies(selectedSpeciesId);
  const selectedCount = getGardenCollectionCount(garden, selectedSpecies.id);
  const cooperativeCount = garden.plants.filter((plant) => (
    plant.speciesId === selectedSpecies.id
    && plant.completedAt
    && isCooperativeBloom(plant)
  )).length;
  const collectedSpeciesCount = GARDEN_SPECIES.filter((species) => (
    getGardenCollectionCount(garden, species.id) > 0
  )).length;
  const filteredSpecies = GARDEN_SPECIES.filter((species) => {
    const count = getGardenCollectionCount(garden, species.id);
    const matchesQuery = `${species.commonName} ${species.scientificName}`
      .toLocaleLowerCase()
      .includes(searchQuery.trim().toLocaleLowerCase());
    const matchesCollection = collectionFilter === 'all'
      || (collectionFilter === 'collected' && count > 0)
      || (collectionFilter === 'uncollected' && count === 0);
    return matchesQuery && matchesCollection;
  });

  return (
    <section aria-labelledby="garden-album-title" className="border-t border-bey-steel pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Icons.BookOpen size={18} className="text-bey-cyan" />
            <h3 id="garden-album-title" className="text-base font-bold text-bey-ink">常見植物圖鑑</h3>
          </div>
          <p className="mt-1 text-xs font-normal text-bey-dim">
            已收集 {collectedSpeciesCount} / {GARDEN_SPECIES.length} 種
          </p>
        </div>
        {canStartNextPlant && (
          <span className="rounded-full bg-bey-yellow/30 px-3 py-1 text-xs font-bold text-bey-yellow">
            請選下一顆種子
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">搜尋植物</span>
          <Icons.Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bey-dim" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="搜尋植物名稱"
            className="min-h-10 w-full rounded-xl border border-bey-ink/10 bg-bey-paper py-2 pl-9 pr-3 text-sm font-bold text-bey-ink outline-none placeholder:text-bey-dim focus:border-bey-cyanDark focus:ring-2 focus:ring-bey-cyan/20"
          />
        </label>
        <label className="relative flex-shrink-0">
          <span className="sr-only">篩選收藏狀態</span>
          <select
            value={collectionFilter}
            onChange={(event) => setCollectionFilter(event.target.value as typeof collectionFilter)}
            className="min-h-10 appearance-none rounded-xl border border-bey-ink/10 bg-bey-paper py-2 pl-3 pr-8 text-xs font-bold text-bey-ink outline-none focus:border-bey-cyanDark focus:ring-2 focus:ring-bey-cyan/20"
          >
            <option value="all">全部</option>
            <option value="collected">已收集</option>
            <option value="uncollected">未收集</option>
          </select>
          <Icons.ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-bey-dim" />
        </label>
      </div>

      <div className="mt-2 grid max-h-56 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4" aria-label="植物列表">
        {filteredSpecies.map((species) => {
          const count = getGardenCollectionCount(garden, species.id);
          const selected = species.id === selectedSpeciesId;

          return (
            <button
              key={species.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setSelectedSpeciesId(species.id)}
              className={`min-h-14 rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bey-cyanDark ${
                selected
                  ? 'bg-bey-cyanDark text-white'
                  : 'bg-bey-deep/75 text-bey-ink hover:bg-bey-cyan/15'
              }`}
            >
              <span className="block text-xs font-bold">{species.commonName}</span>
              <span className={`block text-xs font-bold ${selected ? 'text-white' : 'text-bey-dim'}`}>
                {count > 0 ? `開花 ${count} 次` : '尚未收集'}
              </span>
            </button>
          );
        })}
        {filteredSpecies.length === 0 && (
          <p className="col-span-full py-4 text-center text-sm font-normal text-bey-dim">找不到符合條件的植物</p>
        )}
      </div>

      <div role="tabpanel" className="mt-2 rounded-2xl bg-bey-deep/55 p-3 md:p-4">
        <div className="grid items-center gap-3 md:grid-cols-[180px_1fr] md:gap-5">
          <div className="mx-auto w-full max-w-[180px]">
            {selectedCount > 0 ? (
              <GardenPlant speciesId={selectedSpecies.id} stage={5} />
            ) : (
              <div className="opacity-55 grayscale">
                <GardenPlant speciesId={selectedSpecies.id} stage={0} />
                <p className="-mt-4 text-center text-xs font-bold text-bey-ink">等待第一次開花</p>
              </div>
            )}
            {/* 點開看真實照片，讓孩子在野外也認得出這種植物 */}
            <button
              type="button"
              onClick={() => setPhotoSpecies(selectedSpecies)}
              className="mt-1 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-bey-paper px-3 text-xs font-bold text-bey-cyan soft-card transition-transform hover:bg-bey-cyan/10 active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bey-cyanDark"
            >
              <Icons.Camera size={15} />
              看真實照片
            </button>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h4 className="text-base font-bold text-bey-cyan">{selectedSpecies.commonName}</h4>
              <p className="text-xs font-bold italic text-bey-dim">{selectedSpecies.scientificName}</p>
            </div>
            <p className="mt-1 text-xs font-normal text-bey-dim">
              {selectedSpecies.familyName}・{selectedSpecies.growthHabit}
            </p>

            <dl className="mt-3 space-y-2 text-sm text-bey-ink">
              <div>
                <dt className="text-xs font-bold text-bey-cyan">怎麼認出它？</dt>
                <dd className="mt-0.5 leading-relaxed">{selectedSpecies.identifyingFeature}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-bey-cyan">植物小知識</dt>
                <dd className="mt-0.5 leading-relaxed">{selectedSpecies.childFact}</dd>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <div>
                  <dt className="inline font-bold">原生範圍：</dt>
                  <dd className="inline">{selectedSpecies.origin}</dd>
                </div>
                {selectedCount > 0 && (
                  <div>
                    <dt className="inline font-bold">協力開花：</dt>
                    <dd className="inline">{cooperativeCount} 次</dd>
                  </div>
                )}
              </div>
            </dl>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-bey-steel pt-2">
              {canStartNextPlant && (
                <Button
                  size="sm"
                  onClick={() => onStartPlant(selectedSpecies.id)}
                  icon={<Icons.Leaf size={15} />}
                >
                  種下{selectedSpecies.commonName}
                </Button>
              )}
              <a
                href={selectedSpecies.sourceUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`查看 ${selectedSpecies.commonName} 的 Kew Science 資料來源`}
                className="ml-auto inline-flex min-h-8 items-center rounded-lg px-2 text-xs font-normal text-bey-dim hover:bg-bey-paper hover:text-bey-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bey-cyanDark"
              >
                Kew Science ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      {photoSpecies && (
        <GardenPhotoViewer species={photoSpecies} onClose={() => setPhotoSpecies(null)} />
      )}
    </section>
  );
};
