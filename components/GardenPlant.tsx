import React, { useId } from 'react';
import { GardenSpecies, getGardenSpecies } from '../services/gardenUtils';
import { getGardenSceneById } from './GardenScene';

interface GardenPlantProps {
  speciesId: string;
  stage: number;
  /** 背景場景；未指定時使用晴天草地 */
  sceneId?: string;
  className?: string;
}

const PETAL_ANGLES_6 = Array.from({ length: 6 }, (_, index) => index * 60);
const PETAL_ANGLES_8 = Array.from({ length: 8 }, (_, index) => index * 45);
const PETAL_ANGLES_12 = Array.from({ length: 12 }, (_, index) => index * 30);
const PETAL_ANGLES_16 = Array.from({ length: 16 }, (_, index) => index * 22.5);
const PETAL_ANGLES_24 = Array.from({ length: 24 }, (_, index) => index * 15);

/** 細長葉：大波斯菊、萬壽菊、鬱金香、薰衣草、蒲公英 */
const NARROW_LEAF_SPECIES = new Set(['cosmos', 'marigold', 'tulip', 'lavender', 'dandelion']);
/** 心形葉：牽牛花、向日葵 */
const HEART_LEAF_SPECIES = new Set(['morning-glory', 'sunflower']);
/** 一莖一花，不畫側邊的第二朵花 */
const SINGLE_HEAD_SPECIES = new Set(['sunflower', 'tulip']);

const HYDRANGEA_FLORETS: Array<[number, number]> = [
  [160, 50], [131, 65], [189, 65], [117, 91], [160, 82], [203, 91], [136, 111], [184, 111], [160, 116],
];

const SimpleLeaf: React.FC<{
  x: number;
  y: number;
  flip?: boolean;
  narrow?: boolean;
  heart?: boolean;
  gradientId: string;
}> = ({ x, y, flip = false, narrow = false, heart = false, gradientId }) => {
  const transform = `translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`;
  const path = heart
    ? 'M0 1 C12 -12 30 -5 27 11 C25 24 10 32 0 39 C-10 32 -25 24 -27 11 C-30 -5 -12 -12 0 1 Z'
    : narrow
      ? 'M0 0 C19 -7 31 0 34 7 C21 13 10 12 0 0 Z'
      : 'M0 0 C20 -14 39 -8 44 2 C36 18 17 24 0 0 Z';

  return (
    <g transform={transform}>
      <path d={path} fill={`url(#${gradientId})`} stroke="#2C7A4B" strokeWidth="2" strokeLinejoin="round" />
      <path d={heart ? 'M0 3 L0 34' : 'M2 1 C13 5 24 4 36 1'} fill="none" stroke="#DCEBCF" strokeWidth="1.7" strokeLinecap="round" />
      {!heart && <path d="M13 5 L20 12 M23 4 L28 9" fill="none" stroke="#397B43" strokeWidth="1" strokeLinecap="round" opacity="0.65" />}
    </g>
  );
};

const FlowerHead: React.FC<{ species: GardenSpecies; petalGradientId: string }> = ({ species, petalGradientId }) => {
  switch (species.id) {
    case 'cosmos':
      return (
        <g>
          {PETAL_ANGLES_8.map((angle) => (
            <ellipse key={angle} cx="160" cy="55" rx="17" ry="32" fill={`url(#${petalGradientId})`} stroke="#C76E91" strokeWidth="2" transform={`rotate(${angle} 160 86)`} />
          ))}
          <circle cx="160" cy="86" r="18" fill={species.flowerAccent} stroke="#B96828" strokeWidth="2" />
          <circle cx="160" cy="86" r="7" fill="#8C6A24" opacity="0.7" />
        </g>
      );
    case 'marigold':
      return (
        <g>
          {PETAL_ANGLES_16.map((angle) => (
            <ellipse key={`outer-${angle}`} cx="160" cy="55" rx="13" ry="26" fill={`url(#${petalGradientId})`} stroke={species.flowerAccent} strokeWidth="1.5" transform={`rotate(${angle} 160 82)`} />
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
            <path key={angle} d="M160 84 C145 64 148 47 160 41 C172 47 175 64 160 84 Z" fill={`url(#${petalGradientId})`} stroke="#B84F49" strokeWidth="1.6" transform={`rotate(${angle} 160 84)`} />
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
          <path d="M117 42 C127 24 193 24 203 42 C199 68 185 91 160 101 C135 91 121 68 117 42 Z" fill={`url(#${petalGradientId})`} stroke="#5463B5" strokeWidth="3" />
          <path d="M126 44 C141 53 150 66 160 91 C170 66 179 53 194 44" fill="none" stroke="#AEB8F2" strokeWidth="3" strokeLinecap="round" />
          <circle cx="160" cy="87" r="8" fill={species.flowerAccent} />
        </g>
      );
    case 'hibiscus':
      return (
        <g>
          {[0, 72, 144, 216, 288].map((angle) => (
            <path key={angle} d="M160 85 C134 66 130 39 146 28 C163 34 173 56 160 85 Z" fill={`url(#${petalGradientId})`} stroke="#B83E45" strokeWidth="2" transform={`rotate(${angle} 160 85)`} />
          ))}
          <circle cx="160" cy="85" r="12" fill="#B83E45" />
          <path d="M160 84 C175 77 190 72 211 66" fill="none" stroke="#C44750" strokeWidth="5" strokeLinecap="round" />
          {[0, 1, 2, 3, 4].map((index) => (
            <circle key={index} cx={205 + index * 4} cy={62 + (index % 2) * 7} r="3.5" fill="#F6D96B" />
          ))}
        </g>
      );
    case 'dandelion':
      return (
        <g>
          {PETAL_ANGLES_24.map((angle) => (
            <rect key={`outer-${angle}`} x="156.5" y="44" width="7" height="42" rx="3.5" fill={`url(#${petalGradientId})`} stroke={species.flowerAccent} strokeWidth="0.9" transform={`rotate(${angle} 160 84)`} />
          ))}
          {PETAL_ANGLES_16.map((angle) => (
            <rect key={`inner-${angle}`} x="157" y="58" width="6" height="28" rx="3" fill="#F4CE55" stroke={species.flowerAccent} strokeWidth="0.8" transform={`rotate(${angle + 7} 160 84)`} />
          ))}
          <circle cx="160" cy="84" r="11" fill="#E8B733" stroke={species.flowerAccent} strokeWidth="1.5" />
        </g>
      );
    case 'tulip':
      return (
        <g>
          <path d="M160 114 C133 106 125 76 133 44 C142 52 150 54 160 50 C170 54 178 52 187 44 C195 76 187 106 160 114 Z" fill={`url(#${petalGradientId})`} stroke={species.flowerAccent} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M141 52 C137 78 143 98 160 108" fill="none" stroke="#F6C6CE" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
          <path d="M160 50 C155 74 155 94 160 112" fill="none" stroke={species.flowerAccent} strokeWidth="2" strokeLinecap="round" opacity="0.55" />
          <path d="M179 52 C183 78 177 98 160 108" fill="none" stroke={species.flowerAccent} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        </g>
      );
    case 'rose':
      return (
        <g>
          {PETAL_ANGLES_8.map((angle) => (
            <path key={`outer-${angle}`} d="M160 84 C136 80 127 59 140 45 C153 35 173 40 177 56 C180 71 172 81 160 84 Z" fill={`url(#${petalGradientId})`} stroke={species.flowerAccent} strokeWidth="1.6" transform={`rotate(${angle} 160 84)`} />
          ))}
          {PETAL_ANGLES_6.map((angle) => (
            <path key={`inner-${angle}`} d="M160 84 C146 81 140 68 148 58 C157 50 170 54 172 65 C174 76 169 82 160 84 Z" fill={species.flowerColor} stroke={species.flowerAccent} strokeWidth="1.2" transform={`rotate(${angle + 22} 160 84)`} />
          ))}
          <path d="M160 84 C151 81 150 71 158 67 C166 64 171 72 167 78 C164 82 158 81 158 76" fill="none" stroke={species.flowerAccent} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );
    case 'hydrangea':
      return (
        <g>
          <circle cx="160" cy="84" r="52" fill={species.flowerAccent} opacity="0.22" />
          {HYDRANGEA_FLORETS.map(([cx, cy], index) => (
            <g key={`floret-${cx}-${cy}`}>
              {[0, 90, 180, 270].map((angle) => (
                <ellipse
                  key={angle}
                  cx={cx}
                  cy={cy - 11}
                  rx="8"
                  ry="11"
                  fill={index % 2 === 0 ? `url(#${petalGradientId})` : species.flowerAccent}
                  stroke="#5F84BC"
                  strokeWidth="1.1"
                  transform={`rotate(${angle + index * 11} ${cx} ${cy})`}
                />
              ))}
              <circle cx={cx} cy={cy} r="3.2" fill="#F6F1B8" stroke="#5F84BC" strokeWidth="0.8" />
            </g>
          ))}
        </g>
      );
    case 'moth-orchid':
      return (
        <g>
          <ellipse cx="160" cy="45" rx="15" ry="23" fill={`url(#${petalGradientId})`} stroke="#C38FB2" strokeWidth="2" />
          <ellipse cx="121" cy="105" rx="14" ry="22" fill={`url(#${petalGradientId})`} stroke="#C38FB2" strokeWidth="2" transform="rotate(-38 121 105)" />
          <ellipse cx="199" cy="105" rx="14" ry="22" fill={`url(#${petalGradientId})`} stroke="#C38FB2" strokeWidth="2" transform="rotate(38 199 105)" />
          <ellipse cx="117" cy="65" rx="31" ry="25" fill={`url(#${petalGradientId})`} stroke="#C38FB2" strokeWidth="2" transform="rotate(-16 117 65)" />
          <ellipse cx="203" cy="65" rx="31" ry="25" fill={`url(#${petalGradientId})`} stroke="#C38FB2" strokeWidth="2" transform="rotate(16 203 65)" />
          <path d="M160 76 C173 81 177 96 168 107 C163 113 157 113 152 107 C143 96 147 81 160 76 Z" fill={species.flowerAccent} stroke="#B87BA5" strokeWidth="1.8" />
          <path d="M151 105 C145 116 141 118 135 115 M169 105 C175 116 179 118 185 115" fill="none" stroke="#C99BB9" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="160" cy="74" rx="7" ry="6" fill="#F3D98C" stroke="#C38FB2" strokeWidth="1.2" />
        </g>
      );
    case 'lavender':
      return (
        <g>
          <path d="M160 122 V40" fill="none" stroke="#5F8F52" strokeWidth="4" strokeLinecap="round" />
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const y = 46 + index * 14;
            const offset = 8 + index * 1.8;

            return (
              <g key={`whorl-${index}`}>
                <ellipse cx={160 - offset} cy={y} rx="8.5" ry="6.8" fill={`url(#${petalGradientId})`} stroke={species.flowerAccent} strokeWidth="1.2" />
                <ellipse cx={160 + offset} cy={y} rx="8.5" ry="6.8" fill={species.flowerColor} stroke={species.flowerAccent} strokeWidth="1.2" />
                <ellipse cx="160" cy={y - 6} rx="7" ry="6" fill={species.flowerAccent} opacity="0.85" />
              </g>
            );
          })}
          <ellipse cx="160" cy="38" rx="6" ry="7" fill={species.flowerAccent} />
        </g>
      );
    case 'sunflower':
    default:
      return (
        <g>
          {PETAL_ANGLES_16.map((angle) => (
            <ellipse key={angle} cx="160" cy="47" rx="12" ry="31" fill={`url(#${petalGradientId})`} stroke="#D69A20" strokeWidth="1.8" transform={`rotate(${angle} 160 82)`} />
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

export const GardenPlant: React.FC<GardenPlantProps> = ({ speciesId, stage, sceneId, className = '' }) => {
  const species = getGardenSpecies(speciesId);
  const { Scenery } = getGardenSceneById(sceneId);
  const safeStage = Math.min(5, Math.max(0, Math.floor(stage)));
  const isMorningGlory = species.id === 'morning-glory';
  const leafIsNarrow = NARROW_LEAF_SPECIES.has(species.id);
  const leafIsHeart = HEART_LEAF_SPECIES.has(species.id);
  const stemTop = safeStage >= 4 ? 88 : safeStage >= 3 ? 112 : safeStage >= 2 ? 148 : 197;
  const svgId = useId().replace(/:/g, '');
  const leafGradientId = `${svgId}-leaf`;
  const potGradientId = `${svgId}-pot`;
  const soilGradientId = `${svgId}-soil`;
  const petalGradientId = `${svgId}-petal`;
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
      <defs>
        <linearGradient id={leafGradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#83BB69" />
          <stop offset="0.55" stopColor="#5A9A55" />
          <stop offset="1" stopColor="#3F7E43" />
        </linearGradient>
        <linearGradient id={potGradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F0B77F" />
          <stop offset="0.58" stopColor="#D78F58" />
          <stop offset="1" stopColor="#B96E42" />
        </linearGradient>
        <linearGradient id={soilGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#806047" />
          <stop offset="1" stopColor="#503827" />
        </linearGradient>
        <linearGradient id={petalGradientId} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.38" />
          <stop offset="0.24" stopColor={species.flowerColor} />
          <stop offset="1" stopColor={species.flowerAccent} />
        </linearGradient>
      </defs>
      <Scenery />
      <g className="garden-plant-stage" key={`${species.id}-${safeStage}`}>
        {safeStage >= 4 && <circle cx="160" cy="84" r="76" fill="#F6D96B" opacity="0.16" />}
        {safeStage >= 5 && (
          <g fill="#F6D96B" opacity="0.9">
            <path d="M67 80 l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
            <path d="M247 51 l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
            <circle cx="245" cy="126" r="3" />
          </g>
        )}

        <ellipse cx="160" cy="278" rx="92" ry="15" fill="#9A7B55" opacity="0.2" />
        <ellipse cx="160" cy="291" rx="61" ry="7" fill="#B56D43" opacity="0.55" />
        <path d="M92 245 H228 L214 293 H106 Z" fill={`url(#${potGradientId})`} stroke="#8F5B3B" strokeWidth="3" strokeLinejoin="round" />
        <path d="M112 252 L118 283" fill="none" stroke="#F5C496" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
        <path d="M102 245 H218" stroke="#F1C08C" strokeWidth="9" strokeLinecap="round" />
        <path d="M106 248 H214" stroke="#B87349" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
        <ellipse cx="160" cy="246" rx="60" ry="11" fill={`url(#${soilGradientId})`} />
        <g fill="#B18A66" opacity="0.7">
          <circle cx="127" cy="245" r="2.5" />
          <circle cx="188" cy="243" r="2" />
          <circle cx="204" cy="247" r="1.7" />
        </g>

        {safeStage === 0 && (
          <g>
            <ellipse cx="160" cy="238" rx="13" ry="8" fill="#A4773E" stroke="#5E432B" strokeWidth="2" transform="rotate(-18 160 238)" />
            <path d="M151 238 C156 235 163 234 169 237" fill="none" stroke="#D8B67A" strokeWidth="1.5" />
          </g>
        )}

        {safeStage >= 1 && (
          <>
            <path d={`M160 245 C158 213 162 165 160 ${stemTop}`} fill="none" stroke="#2F6F3D" strokeWidth={safeStage >= 3 ? 10 : 8} strokeLinecap="round" />
            <path d={`M157 242 C157 210 159 163 158 ${stemTop + 5}`} fill="none" stroke="#83BB69" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
            <SimpleLeaf x={157} y={safeStage === 1 ? 204 : 196} narrow={leafIsNarrow} heart={leafIsHeart && safeStage >= 2} gradientId={leafGradientId} />
            <SimpleLeaf x={163} y={safeStage === 1 ? 210 : 184} flip narrow={leafIsNarrow} heart={leafIsHeart && safeStage >= 2} gradientId={leafGradientId} />
          </>
        )}

        {safeStage >= 3 && (
          <>
            <path d="M158 173 C139 159 124 148 108 139" fill="none" stroke="#3F7E43" strokeWidth="5" strokeLinecap="round" />
            <path d="M162 154 C181 144 194 134 207 120" fill="none" stroke="#3F7E43" strokeWidth="5" strokeLinecap="round" />
            <SimpleLeaf x={158} y={151} narrow={leafIsNarrow} heart={leafIsHeart} gradientId={leafGradientId} />
            <SimpleLeaf x={162} y={137} flip narrow={leafIsNarrow} heart={leafIsHeart} gradientId={leafGradientId} />
            <SimpleLeaf x={112} y={139} flip narrow={leafIsNarrow} heart={leafIsHeart} gradientId={leafGradientId} />
            <SimpleLeaf x={203} y={121} narrow={leafIsNarrow} heart={leafIsHeart} gradientId={leafGradientId} />
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

        {safeStage >= 5 && (
          <>
            {!SINGLE_HEAD_SPECIES.has(species.id) && (
              <g>
                <path d="M111 139 C117 127 120 117 123 106" fill="none" stroke="#3F7E43" strokeWidth="4" strokeLinecap="round" />
                <g transform="translate(123 103) scale(0.36) translate(-160 -82)">
                  <FlowerHead species={species} petalGradientId={petalGradientId} />
                </g>
              </g>
            )}
            <FlowerHead species={species} petalGradientId={petalGradientId} />
          </>
        )}
      </g>
    </svg>
  );
};
