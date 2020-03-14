import * as koa from 'koa'

// @ts-ignore
const app: koa = new koa()

app.use(async ctx => {
    ctx.body = "Helloword";
});

app.listen(3000)

console.log("http://localhost:3000")