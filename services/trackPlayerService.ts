import TrackPlayer, { Event } from 'react-native-track-player';

module.exports = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => void TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => void TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => void TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => void TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, (e) => void TrackPlayer.seekTo(e.position));
  TrackPlayer.addEventListener(Event.RemoteStop, () => void TrackPlayer.stop());
};
