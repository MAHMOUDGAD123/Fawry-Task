// fastify ecosystem imports
import fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import cors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import fastifyEnv from "@fastify/env";
// other imports
import ejs from "ejs";
import path from "path";
// local imports
import { CORS_OPTIONS, ENV_OPTIONS, SESSION_OPTIONS } from "@/utils/config";
// routes
import { storeRoutes } from "./routes/store";

const MODE = import.meta.env.MODE as EnvironmentMode;

const app: FastifyInstance = fastify({
  disableRequestLogging: true,
});

app.register(fastifyEnv, ENV_OPTIONS);
app.register(fastifyCookie);
app.register(fastifySession, SESSION_OPTIONS);
app.register(cors, CORS_OPTIONS);
app.register(fastifyView, {
  engine: { ejs },
  root: path.resolve(import.meta.dirname, "../views"),
});
app.register(fastifyStatic, {
  root: path.resolve(import.meta.dirname, "../public"),
});

// Register the API routes
app.register(storeRoutes, { prefix: "/api" });

app.get("/", async (_req: FastifyRequest, _res: FastifyReply) => {
  return _res.view("index");
});

app.get("/api", async (_req: FastifyRequest, _res: FastifyReply) => {
  return _res.view("index");
});

// Not found
app.setNotFoundHandler((_req, _res) => {
  return _res.code(404).view("404", { pathname: _req.url });
});

// On production
if (MODE === "production") {
  (async () => {
    app.listen(
      {
        port: process.env.PORT ? +process.env.PORT : 3579,
      },
      (err, address) => {
        if (err) {
          app.log.error(err.message);
          process.exit(1);
        } else {
          console.clear();
          console.log(
            `\x1b[30mfastify running at\x1b[39m [\x1b[36m\x1b[1m ${address} \x1b[39m]`
          );
        }
      }
    );
  })();
}

export const viteNodeApp = app; // for vite-plugin-node
export default app; // for vercel deployment
