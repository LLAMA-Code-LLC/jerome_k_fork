const DotEnv = require('dotenv')
const parsedEnv = DotEnv.config().parsed
module.exports = function (ctx) {

  parsedEnv['FREEOSGOV_CONTRACT'] = ctx.dev ? "freeosgov2" : "freeosgov2"
  parsedEnv['FREEOSTOKENS_CONTRACT'] = ctx.dev ? "freeostokens" : "freeostokens"
  parsedEnv['FREEBITOKENS_CONTRACT'] = ctx.dev ? "freebi" : "freebi"
  parsedEnv['TIMED_FETCH_DELAY'] = ctx.dev ? 5000 : 5000
  parsedEnv['VUE_ROUTER_MODE'] = ctx.dev ? "hash" : "history"

  return parsedEnv
}
