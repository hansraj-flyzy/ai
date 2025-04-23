import app from "./app";
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import OAuthProvider from "@cloudflare/workers-oauth-provider";

export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Demo",
		version: "1.0.0",
	});

	async init() {
		this.server.tool(
			"add",
			{ a: z.number(), b: z.number() },
			async ({ a, b }) => ({
				content: [{ type: "text", text: String(a + b) }],
			})
		);
	}
}

// Export the OAuth handler as the default
export default new OAuthProvider({
	apiRoute: ["/sse", "/mcp"],
	apiHandler: {
		// @ts-ignore
		fetch(request: Request, env: Env, ctx: ExecutionContext) {
			const url = new URL(request.url);

			if (url.pathname === "/sse" || url.pathname === "/sse/message") {
				// @ts-ignore
				return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
			}

			console.log("url.pathname", url.pathname);
			if (url.pathname === "/mcp") {
				// @ts-ignore
				return MyMCP.serve("/mcp").fetch(request, env, ctx);
			}

			return new Response("Not found", { status: 404 });
		},
	},
	// @ts-ignore
	defaultHandler: app,
	authorizeEndpoint: "/authorize",
	tokenEndpoint: "/token",
	clientRegistrationEndpoint: "/register",
});
