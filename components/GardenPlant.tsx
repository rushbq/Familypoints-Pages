import React from 'react';
import { GardenSpecies, getGardenSpecies } from '../services/gardenUtils';

interface GardenPlantProps {
  speciesId: string;
  stage: number;
  className?: string;
}

const PETAL_ANGLES_8 = Array.from({ length: 8 }, (_, index) => index * 45);
const PETAL_ANGLES_12 = Array.from({ length: 12 }, (_, index) => index * 30);
const PETAL_ANGLES_16 = Array.from({ length: 16 }, (_, index) => index * 22.5);

const SimpleLeaf: React.FC<{
  x: number;
  y: number;
  flip?: boolean;
  narrow?: boolean;
  heart?: boolean;
}> = ({ x, y, flip = false, narrow = false, heart = false }) => {
  const transform = `translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`;
  const path = heart
    ? 'M0 1 C12 -12 30 -5 27 11 C25 24 10 32 0 39 C-10 32 -25 24 -27 11 C-30 -5 -12 -12 0 1 Z'
    : narrow
      ? 'M0 0 C19 -7 31 0 34 7 C21 13 10 12 0 0 Z'
      : 'M0 0 C20 -14 39 -8 44 2 C36 18 17 24 0 0 Z';

  return (
    <g transform={transform}>
      <path d={path} fill="#5A9A55" stroke="#2C7A4B" strokeWidth="2" strokeLinejoin="round" />
      <path d={heart ? 'M0 3 L0 34' : 'M2 1 C13 5 24 4 36 1'} fill="none" stroke="#DCEBCF" strokeWidth="1.7" strokeLinecap="round" />
    </g>
  );
};

const FlowerHead: React.FC<{ species: GardenSpecies }> = ({ species }) => {
  switch (species.id) {
    case 'cosmos':
      return (
        <g>
          {PETAL_ANGLES_8.map((angle) => (
            <ellipse key={angle} cx="160" cy="55" rx="17" ry="32" fill={species.flowerColor} stroke="#C76E91" strokeWidth="2" transform={`rotate(${angle} 160 86)`} />
          ))}
          <circle cx="160" cy="86" r="18" fill={species.flowerAccent} stroke="#B96828" strokeWidth="2" />
          <circle cx="160" cy="86" r="7" fill="#8C6A24" opacity="0.7" />
        </g>
      );
    case 'marigold':
      return (
        <g>
          {PETAL_ANGLES_16.map((angle) => (
            <ellipse key={`outer-${angle}`} cx="160" cy="55" rx="13" ry="26" fill={species.flowerColor} stroke={species.flowerAccent} strokeWidth="1.5" transform={`rotate(${angle} 160 82)`} />
          ))}
          {PETAL_ANGLES_12.map((angle) => (
            <ellipse key={`inner-${angle}`} cx="160" cy="64" rx="10" ry="19" fill="#F6B84D" stroke={species.flowerAccent} strokeWidth="1.2" transform={`rotate(${angle} 160 82)`} />
          ))}
          <circle cx="160" cy="82" r="14" fill="#F0A24A" />
        </g>
      );
    case 'zinnia':
      return (
        <g>
          {PETAL_ANGLES_12.map((angle) => (
            <path key={angle} d="M160 84 C145 64 148 47 160 41 C172 47 175 64 160 84 Z" fill={species.flowerColor} stroke="#B84F49" strokeWidth="1.6" transform={`rotate(${angle} 160 84)`} />
          ))}
          {PETAL_ANGLES_8.map((angle) => (
            <ellipse key={`inner-${angle}`} cx="160" cy="67" rx="8" ry="17" fill="#EF8D72" transform={`rotate(${angle} 160 84)`} />
          ))}
          <circle cx="160" cy="84" r="13" fill={species.flowerAccent} stroke="#B96828" strokeWidth="2" />
        </g>
      );
    case 'morning-glory':
      return (
        <g>
          <path d="M117 42 C127 24 193 24 203 42 C199 68 185 91 160 101 C135 91 121 68 117 42 Z" fill={species.flowerColor} stroke="#5463B5" strokeWidth="3" />
          <path d="M126 44 C141 53 150 66 160 91 C170 66 179 53 194 44" fill="none" stroke="#AEB8F2" strokeWidth="3" strokeLinecap="round" />
          <circle cx="160" cy="87" r="8" fill={species.flowerAccent} />
        </g>
      );
    case 'hibiscus':
      return (
        <g>
          {[0, 72, 144, 216, 288].map((angle) => (
            <path key={angle} d="M160 85 C134 66 130 39 146 28 C163 34 173 56 160 85 Z" fill={species.flowerColor} stroke="#B83E45" strokeWidth="2" transform={`rotate(${angle} 160 85)`} />
          ))}
          <circle cx="160" cy="85" r="12" fill="#B83E45" />
          <path d="M160 84 C175 77 190 72 211 66" fill="none" stroke="#C44750" strokeWidth="5" strokeLinecap="round" />
          {[0, 1, 2, 3, 4].map((index) => (
            <circle key={index} cx={205 + index * 4} cy={62 + (index % 2) * 7} r="3.5" fill="#F6D96B" />
          ))}
        </g>
      );
    case 'sunflower':
    default:
      return (
        <g>
          {PETAL_ANGLES_16.map((angle) => (
            <ellipse key={angle} cx="160" cy="47" rx="12" ry="31" fill={species.flowerColor} stroke="#D69A20" strokeWidth="1.8" transform={`rotate(${angle} 160 82)`} />
          ))}
          <circle cx="160" cy="82" r="33" fill={species.flowerAccent} stroke="#4D341C" strokeWidth="3" />
          {PETAL_ANGLES_12.map((angle) => (
            <circle key={`seed-${angle}`} cx="160" cy="61" r="3" fill="#B8843B" transform={`rotate(${angle} 160 82)`} />
          ))}
          <circle cx="160" cy="82" r="10" fill="#3F2D1C" />
        </g>
      );
  }
};

export const GardenPlant: React.FC<GardenPlantProps> = ({ speciesId, stage, className = '' }) => {
  const species = getGardenSpecies(speciesId);
  const safeStage = Math.min(5, Math.max(0, Math.floor(stage)));
  const isCosmos = species.id === 'cosmos';
  const isMorningGlory = species.id === 'morning-glory';
  const leafIsNarrow = isCosmos || species.id === 'marigold';
  const leafIsHeart = isMorningGlory || species.id === 'sunflower';
  const stemTop = safeStage >= 4 ? 88 : safeStage >= 3 ? 112 : safeStage >= 2 ? 148 : 197;
  const viewBox = safeStage === 0
    ? '0 110 320 190'
    : safeStage === 1
      ? '0 75 320 225'
      : safeStage === 2
        ? '0 45 320 255'
        : '0 0 320 300';

  return (
    <svg
      viewBox={viewBox}
      className={`block h-auto w-full ${className}`}
      role="img"
      aria-label={`${species.commonName}，${['種子', '發芽', '長出新葉', '小植株', '花苞', '開花'][safeStage]}階段`}
    >
      <g className="garden-plant-stage" key={`${species.id}-${safeStage}`}>
        <ellipse cx="160" cy="267" rx="86" ry="18" fill="#D8C29C" />
        <path d="M92 245 H228 L214 293 H106 Z" fill="#D99A62" stroke="#9E6841" strokeWidth="3" strokeLinejoin="round" />
        <path d="M102 245 H218" stroke="#F1C08C" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="160" cy="246" rx="60" ry="11" fill="#70513A" />

        {safeStage === 0 && (
          <g>
            <ellipse cx="160" cy="238" rx="13" ry="8" fill="#A4773E" stroke="#5E432B" strokeWidth="2" transform="rotate(-18 160 238)" />
            <path d="M151 238 C156 235 163 234 169 237" fill="none" stroke="#D8B67A" strokeWidth="1.5" />
          </g>
        )}

        {safeStage >= 1 && (
          <>
            <path d={`M160 245 C158 213 162 165 160 ${stemTop}`} fill="none" stroke="#3F7E43" strokeWidth={safeStage >= 3 ? 9 : 7} strokeLinecap="round" />
            <SimpleLeaf x={157} y={safeStage === 1 ? 204 : 196} narrow={leafIsNarrow} heart={leafIsHeart && safeStage >= 2} />
            <SimpleLeaf x={163} y={safeStage === 1 ? 210 : 184} flip narrow={leafIsNarrow} heart={leafIsHeart && safeStage >= 2} />
          </>
        )}

        {safeStage >= 3 && (
          <>
            <SimpleLeaf x={158} y={151} narrow={leafIsNarrow} heart={leafIsHeart} />
            <SimpleLeaf x={162} y={137} flip narrow={leafIsNarrow} heart={leafIsHeart} />
          </>
        )}

        {isMorningGlory && safeStage >= 2 && (
          <path d="M179 235 C233 216 207 173 175 170 C140 166 138 126 186 113" fill="none" stroke="#4C8C51" strokeWidth="5" strokeLinecap="round" />
        )}

        {safeStage === 1 && (
          <g>
            <ellipse cx="148" cy="199" rx="17" ry="8" fill="#75AE62" stroke="#2C7A4B" strokeWidth="2" transform="rotate(-22 148 199)" />
            <ellipse cx="172" cy="199" rx="17" ry="8" fill="#75AE62" stroke="#2C7A4B" strokeWidth="2" transform="rotate(22 172 199)" />
          </g>
        )}

        {safeStage === 4 && (
          <g>
            <path d="M126 91 C133 62 187 62 194 91 C184 112 136 112 126 91 Z" fill="#5F9A55" stroke="#2C7A4B" strokeWidth="3" />
            <path d="M139 91 C143 75 177 75 181 91" fill={species.flowerColor} stroke="#2C7A4B" strokeWidth="2" />
          </g>
        )}

        {safeStage >= 5 && <FlowerHead species={species} />}
      </g>
    </svg>
  );
};
