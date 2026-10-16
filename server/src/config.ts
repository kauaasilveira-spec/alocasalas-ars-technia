export const config = {
  port: Number(process.env.PORT ?? 3001),
  jwtSecret: process.env.JWT_SECRET ?? 'alocasalas-dev-secret',
  dbPath: process.env.DB_PATH ?? './alocasalas.db',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  timezone: 'America/Sao_Paulo',
};
