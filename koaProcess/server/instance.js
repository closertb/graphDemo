require('colors');
const Koa = require('koa');
const app = new Koa();
const koaNunjucks = require('koa-nunjucks-2');
const koaStatic = require('koa-static');
const bodyParser = require('koa-body');
const KoaRouter = require('koa-router');
const router = new KoaRouter();
const path = require('path');
const compress = require('koa-compress');

class AngelConfig {
  constructor(options) {
    this.config = require(options.configUrl);
    this.app = app;
    this.router = require(options.routerUrl);
    this.setDefaultConfig(); 
    this.setServerConfig();
    
  }

  setDefaultConfig() {
    //静态文件根目录
    this.config.root = this.config.root ? this.config.root : path.join(process.cwd(), 'static');
    //默认静态配置
    this.config.static = this.config.static ? this.config.static : {};
  }

  setServerConfig() {
    this.port = this.config.listen.port;

    //cookie签名验证
    this.app.keys = this.config.keys ? this.config.keys : this.app.keys;

  }
}

//启动服务器
class AngelServer extends AngelConfig {
  constructor(options) {
    super(options);
    this.startService();
  }

  startService() {
    //开启gzip压缩
    this.app.use(compress(this.config.compress));

      //模板语法
    // this.app.use(koaNunjucks({
    //   ext: 'html',
    //   path: path.join(process.cwd(), 'views'),
    //   nunjucksConfig: {
    //     trimBlocks: true
    //   }
    // }));
    
    // 响应监测中间件
    this.app.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      console.log('response:', `${ctx.url}`, `the process pid is: ${process.pid}`);
      ctx.set('X-Response-Time', `${ms}ms`);
    });

    // 静态资源
    this.app.use(koaStatic(this.config.root, this.config.static));
    // post 请求body解析
    this.app.use(bodyParser({
      multipart: true,
      formidable:{
        // uploadDir:path.join(__dirname,'../static/'), // 设置文件上传目录
        keepExtensions: true,    // 保持文件的后缀
        maxFieldsSize:2 * 1024 * 1024, // 文件上传大小
        onFileBegin:(name, file) => { // 文件上传前的设置
          // console.log('name:', file);
        },  
      }
    }));
    // 路由解析  
    this.app.use(router.routes()).use(router.allowedMethods());
    // 启动服务器
    this.server = this.app.listen(this.port, () => {
      console.log(`当前服务器已经启动,请访问`,`http://127.0.0.1:${this.port}`.green);
      this.router({
        router,
        config: this.config,
        app: this.app
      });
    });
  }
}

module.exports = AngelServer;

