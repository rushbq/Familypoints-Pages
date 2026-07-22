import React, { useMemo, useState } from 'react';
import { FamilyGardenState } from '../types';
import {
  GARDEN_SPECIES,
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

  return (
    <section aria-labelledby="garden-album-title" className="border-t border-nook-greenDark/10 pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Icons.BookOpen size={18} className="text-nook-greenDark" />
            <h3 id="garden-album-title" className="text-base font-bold text-nook-brown">常見植物圖鑑</h3>
          </div>
          <p className="mt-1 text-xs font-bold text-nook-brown/75">
            已收集 {collectedSpeciesCount} / {GARDEN_SPECIES.length} 種
          </p>
        </div>
        {canStartNextPlant && (
          <span className="rounded-full bg-nook-yellow/30 px-3 py-1 text-xs font-bold text-[#765812]">
            請選下一顆種子
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar" role="tablist" aria-label="植物種類">
        {GARDEN_SPECIES.map((species) => {
          const count = getGardenCollectionCount(garden, species.id);
          const selected = species.id === selectedSpeciesId;

          return (
            <button
              key={species.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setSelectedSpeciesId(species.id)}
              className={`min-h-11 flex-shrink-0 rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nook-greenDark ${
                selected
                  ? 'bg-nook-greenDark text-white'
                  : 'bg-nook-beige/75 text-nook-brown hover:bg-nook-green/15'
              }`}
            >
              <span className="block text-xs font-bold">{species.commonName}</span>
              <span className={`block text-xs font-bold ${selected ? 'text-white' : 'text-nook-brown/75'}`}>
                {count > 0 ? `開花 ${count} 次` : '尚未收集'}
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="mt-2 rounded-2xl bg-nook-beige/55 p-3 md:p-4">
        <div className="grid items-center gap-3 md:grid-cols-[180px_1fr] md:gap-5">
          <div className="mx-auto w-full max-w-[180px]" aria-hidden={selectedCount === 0}>
            {selectedCount > 0 ? (
              <GardenPlant speciesId={selectedSpecies.id} stage={5} />
            ) : (
              <div className="opacity-55 grayscale">
                <GardenPlant speciesId={selectedSpecies.id} stage={0} />
                <p className="-mt-4 text-center text-xs font-bold text-nook-brown">等待第一次開花</p>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h4 className="text-base font-bold text-nook-greenDark">{selectedSpecies.commonName}</h4>
              <p className="text-xs font-bold italic text-nook-brown/75">{selectedSpecies.scientificName}</p>
            </div>
            <p className="mt-1 text-xs font-bold text-nook-brown/75">
              {selectedSpecies.familyName}・{selectedSpecies.growthHabit}
            </p>

            <dl className="mt-3 space-y-2 text-sm text-nook-brown">
              <div>
                <dt className="text-xs font-bold text-nook-greenDark">怎麼認出它？</dt>
                <dd className="mt-0.5 leading-relaxed">{selectedSpecies.identifyingFeature}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-nook-greenDark">植物小知識</dt>
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

            <div className="mt-3 flex flex-wrap items-center gap-2">
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
                className="inline-flex min-h-10 items-center rounded-xl px-3 text-xs font-bold text-nook-greenDark underline decoration-nook-green/40 underline-offset-4 hover:decoration-nook-greenDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nook-greenDark"
              >
                資料來源：Kew Science
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
