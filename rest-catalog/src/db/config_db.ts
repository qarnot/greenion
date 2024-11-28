import * as config from '@config';

// NOTE: we are using `export =` syntax to convert export from ES6 module to CommonJS
// in order to let sequelize cli properly import it.
export = config.database;
