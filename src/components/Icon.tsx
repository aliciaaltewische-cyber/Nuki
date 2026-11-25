import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

const P: Record<string, React.ReactNode> = {
  home: <Path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" />,
  map: <Path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />,
  comm: <><Circle cx={9} cy={8} r={3.5} /><Path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.8 3 2.5 3.5 5.2" /></>,
  cal: <><Rect x={3} y={5} width={18} height={16} rx={3} /><Path d="M3 10h18M8 3v4M16 3v4" /></>,
  user: <><Circle cx={12} cy={8} r={4} /><Path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  back: <Path d="m15 5-7 7 7 7" />,
  filter: <><Path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><Circle cx={16} cy={7} r={2} /><Circle cx={10} cy={17} r={2} /></>,
  search: <><Circle cx={11} cy={11} r={7} /><Path d="m20 20-4-4" /></>,
  x: <Path d="M6 6l12 12M18 6 6 18" />,
  ext: <Path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  route: <><Circle cx={6} cy={18} r={2.5} /><Circle cx={18} cy={6} r={2.5} /><Path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" /></>,
  cam: <><Path d="M4 8h3l2-3h6l2 3h3v11H4z" /><Circle cx={12} cy={13} r={3.5} /></>,
  plus: <Path d="M12 5v14M5 12h14" />,
  minus: <Path d="M5 12h14" />,
  chev: <Path d="m9 6 6 6-6 6" />,
  heart: <Path d="M12 20s-7-4.3-9.2-8.8A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 9.2 5.2C19 15.7 12 20 12 20z" />,
  pin: <><Path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><Circle cx={12} cy={10} r={2.5} /></>,
};
export function Icon({ name, size = 22, color = "#121210", fill = "none", sw = 1.8 }: { name: keyof typeof P | string; size?: number; color?: string; fill?: string; sw?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {P[name]}
    </Svg>
  );
}
