import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { DEFAULT_TEMPLATES } from "@worldbuild/core";

const server = Fastify({
  logger: true,
});

async function main() {
  await server.register(cors, { origin: true });
  await server.register(websocket);

  // Health check
  server.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Lista de templates padrão com campos estruturados
  server.get("/api/templates", async () => {
    return { templates: DEFAULT_TEMPLATES };
  });

  // WebSocket para sincronização em tempo real (Yjs Rooms)
  server.register(async function (fastify) {
    fastify.get("/ws/sync/:roomId", { websocket: true }, (socket, req) => {
      const { roomId } = req.params as { roomId: string };
      server.log.info(`Cliente conectado à sala de sincronização: ${roomId}`);

      socket.on("message", (message: unknown) => {
        // Envia atualização para todos os outros clientes na mesma sala
        // Em produção, isso conecta com o Y-Websocket Document Provider
        socket.send(message);
      });

      socket.on("close", () => {
        server.log.info(`Cliente desconectado da sala: ${roomId}`);
      });
    });
  });

  const port = Number(process.env.PORT) || 4000;
  await server.listen({ port, host: "0.0.0.0" });
  console.log(`🚀 Servidor WorldBuild rodando em http://localhost:${port}`);
}

main().catch((err) => {
  server.log.error(err);
  process.exit(1);
});
