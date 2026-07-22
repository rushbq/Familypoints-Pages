import React, { useId } from 'react';
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

export const GardenPlant: React.FC<GardenPlantProps> = ({ speciesId, stage, className = '' }) => {
  const species = getGardenSpecies(speciesId);
  const safeStage = Math.min(5, Math.max(0, Math.floor(stage)));
  const isCosmos = species.id === 'cosmos';
  const isMorningGlory = species.id === 'morning-glory';
  const leafIsNarrow = isCosmos || species.id === 'marigold';
  const leafIsHeart = isMorningGlory || species.id === 'sunflower';
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
      <g aria-hidden="true">
        <circle cx="258" cy="132" r="24" fill="#F6D96B" opacity="0.22" />
        <g stroke="#D7B83D" strokeWidth="3" strokeLinecap="round" opacity="0.28">
          <path d="M258 96 V86" />
          <path d="M258 178 V168" />
          <path d="M222 132 H212" />
          <path d="M304 132 H294" />
        </g>
        <g fill="#FFFFFF" stroke="#65B7D9" strokeWidth="1.5" opacity="0.72">
          <circle cx="65" cy="126" r="13" />
          <circle cx="81" cy="119" r="18" />
          <circle cx="99" cy="127" r="12" />
          <path d="M53 129 H110 C106 141 58 142 53 129 Z" />
        </g>
        <path d="M18 264 C68 236 111 250 158 258 C210 267 253 233 304 259 L304 294 H18 Z" fill="#DDEDD4" opacity="0.68" />
        <g fill="none" stroke="#75AE62" strokeWidth="3" strokeLinecap="round" opacity="0.55">
          <path d="M53 258 Q49 246 43 240 M53 258 Q58 247 64 242 M53 258 V241" />
          <path d="M271 258 Q267 246 261 241 M271 258 Q277 247 283 243 M271 258 V239" />
        </g>
      </g>
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
            {species.id !== 'sunflower' && (
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
