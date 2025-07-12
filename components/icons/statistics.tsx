import { Path, Svg, SvgProps } from "react-native-svg";
export default function StatisticsIcon(props: SvgProps) {
  return (
    <Svg {...props} viewBox="0 0 25 24" fill="none">
      <Path
        d="M9.25 22H15.25C20.25 22 22.25 20 22.25 15V9C22.25 4 20.25 2 15.25 2H9.25C4.25 2 2.25 4 2.25 9V15C2.25 20 4.25 22 9.25 22Z"
        stroke={props.fill}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M15.75 18.5C16.85 18.5 17.75 17.6 17.75 16.5V7.5C17.75 6.4 16.85 5.5 15.75 5.5C14.65 5.5 13.75 6.4 13.75 7.5V16.5C13.75 17.6 14.64 18.5 15.75 18.5Z"
        stroke={props.fill}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M8.75 18.5C9.85 18.5 10.75 17.6 10.75 16.5V13C10.75 11.9 9.85 11 8.75 11C7.65 11 6.75 11.9 6.75 13V16.5C6.75 17.6 7.64 18.5 8.75 18.5Z"
        stroke={props.fill}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </Svg>
  );
}
