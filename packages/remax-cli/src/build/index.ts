import { Options } from '@remax/types';
import devtools from '@remax/plugin-devtools';
import output from './utils/output';
import remaxVersion from '../remaxVersion';
import { Platform } from '@remax/types';
import getConfig from '../getConfig';
import * as webpack from 'webpack';
import API from '../API';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

export function run(options: Options): webpack.Compiler {
  const api = new API();

  const plugins = [...options.plugins];
  if (process.env.NODE_ENV === 'development' && options.target !== Platform.web) {
    plugins.push(devtools());
  }
  api.registerPlugins(plugins);

  if (options.turboPages && options.turboPages.length > 0 && options.target !== Platform.ali) {
    throw new Error('turboPages 目前仅支持 ali 平台开启');
  }

  if (options.target === Platform.web) {
    // 兼容 herbox 所以用 require
    const buildWeb = require('./web').default;
    return buildWeb(api, options);
  } else {
    const buildMini = require('./mini').default;
    return buildMini(api, options);
  }
}

export function buildApp(argv: Pick<Options, 'target' | 'watch' | 'notify' | 'port' | 'analyze' | 'minimize'>) {
  const { target } = argv;

  process.env.REMAX_PLATFORM = target;

  const { compressTemplate, ...options } = getConfig();

  output.message(`\n⌨️  Remax v${remaxVersion()}\n`, 'green');
  output.message(`🔨 构建应用`, 'blue');
  output.message(`🎯 平台 ${target}`, 'blue');

  const result = run({ ...options, ...argv, compressTemplate: argv.minimize });

  return result;
}

export function buildComponent(argv: { target: Platform; watch?: boolean; notify?: boolean }) {
  const { target } = argv;

  process.env.REMAX_PLATFORM = target;

  if (target !== Platform.ali) {
    output.message('组件构建暂仅支持阿里小程序', 'red');
    process.exit(1);
    return;
  }

  const options = getConfig();

  output.message(`\n⌨️  Remax v${remaxVersion()}\n`, 'green');
  output.message(`🔨 构建组件`, 'blue');
  output.message(`🎯 平台 ${target}`, 'blue');

  const api = new API();
  api.registerPlugins(options.plugins);

  return require('./component').default(api, { ...options, ...argv });
}
