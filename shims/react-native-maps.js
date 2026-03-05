import { View, Text } from 'react-native';

const MapView = (props) => <View {...props}><Text>Map not available on web</Text></View>;

MapView.Marker = View;
MapView.Callout = View;

export const Marker = View;
export const Callout = View;
export const PROVIDER_GOOGLE = 'google';

export default MapView;
