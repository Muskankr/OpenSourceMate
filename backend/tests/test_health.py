import asyncio

import httpx

from app.main import app

def test_health_endpoint_returns_healty_status():
    async def make_request():
        transport = httpx.ASGITransport(app=app)

        async with httpx.AsyncClient(
            transport=transport,
            base_url="https://test",
        ) as client:
            return await client.get("/api/health")
        
    response = asyncio.run(make_request())

    assert response.status_code == 200
    
    assert response.json() == {
        "status": "healthy",
        "service": "OpenSourceMate API",
        "version": "0.1.0",
    }