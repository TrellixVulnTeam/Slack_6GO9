const packageJson = require('../package.json'); // tslint:disable-line:no-require-imports no-var-requires
import pleaseUpgradeNode from 'please-upgrade-node';

pleaseUpgradeNode(packageJson);

export {
  default as App,
  AppOptions,
  Authorize,
  AuthorizeSourceData,
  AuthorizeResult,
  AuthorizationError,
  ActionConstraints,
  LogLevel,
  Logger,
} from './App';

export { ErrorCode } from './errors';

export {
  default as ExpressReceiver,
  ExpressReceiverOptions,
} from './ExpressReceiver';

export * from './middleware/builtin';
export * from './types';

export {
  ConversationStore,
  MemoryStore,
} from './conversation-store';
