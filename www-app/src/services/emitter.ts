import mitt from 'mitt';

type Events = {
  'select-machine-view': void;
  'select-session-view': void;
};

const globalEmitter = mitt<Events>();

export default globalEmitter;
