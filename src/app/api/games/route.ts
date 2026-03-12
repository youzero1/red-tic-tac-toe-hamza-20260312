import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/data-source";
import { GameResult } from "@/lib/entities/GameResult";

export async function GET() {
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(GameResult);

    const results = await repo.find({
      order: { createdAt: "DESC" },
      take: 20,
    });

    const allResults = await repo.find();
    const stats = {
      xWins: allResults.filter((r) => r.winner === "X").length,
      oWins: allResults.filter((r) => r.winner === "O").length,
      draws: allResults.filter((r) => r.winner === "Draw").length,
      total: allResults.length,
    };

    return NextResponse.json({ stats, history: results });
  } catch (error) {
    console.error("GET /api/games error:", error);
    return NextResponse.json(
      { error: "Failed to fetch game data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { winner } = body;

    if (!winner || !["X", "O", "Draw"].includes(winner)) {
      return NextResponse.json(
        { error: "Invalid winner value. Must be X, O, or Draw" },
        { status: 400 }
      );
    }

    const ds = await getDataSource();
    const repo = ds.getRepository(GameResult);

    const gameResult = repo.create({ winner });
    await repo.save(gameResult);

    return NextResponse.json({ success: true, result: gameResult }, { status: 201 });
  } catch (error) {
    console.error("POST /api/games error:", error);
    return NextResponse.json(
      { error: "Failed to save game result" },
      { status: 500 }
    );
  }
}
