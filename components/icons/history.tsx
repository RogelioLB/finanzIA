import { Path, Svg, SvgProps } from "react-native-svg";
export default function HistoryIcon(props: SvgProps) {
  return (
    <Svg {...props} viewBox="0 0 25 24" fill="none">
      <Path d="M13.12 8.88H18.37H13.12Z" fill={props.fill} />
      <Path
        d="M13.12 8.88H18.37"
        stroke={props.fill}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M7.13 8.88L7.88 9.63L10.13 7.38"
        stroke={props.fill}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M13.12 15.88H18.37"
        stroke={props.fill}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M7.13 15.88L7.88 16.63L10.13 14.38"
        stroke={props.fill}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M9.75 22H15.75C20.75 22 22.75 20 22.75 15V9C22.75 4 20.75 2 15.75 2H9.75C4.75 2 2.75 4 2.75 9V15C2.75 20 4.75 22 9.75 22Z"
        stroke={props.fill}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </Svg>
  );
}
