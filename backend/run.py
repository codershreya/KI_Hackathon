"""Uvicorn entry point — equivalent to `nodemon --exec ts-node src/index.ts`."""
import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=3001, reload=True)
