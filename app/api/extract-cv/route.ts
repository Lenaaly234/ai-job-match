import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("cv");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No CV file was provided." },
        { status: 400 }
      );
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return NextResponse.json(
        { error: "The CV must be a PDF file." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "The PDF must be smaller than 5 MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await getDocumentProxy(
      new Uint8Array(arrayBuffer)
    );

    const result = await extractText(pdf, {
      mergePages: true,
    });

    const text = result.text.trim();

    if (!text) {
      return NextResponse.json(
        {
          error:
            "We couldn't find readable text in this PDF. Please try a text-based CV PDF.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text,
      characterCount: text.length,
      pages: result.totalPages,
    });
  } catch (error) {
    console.error("PDF extraction error:", error);

    return NextResponse.json(
      {
        error:
          "We couldn't read this PDF. Please try another CV file.",
      },
      { status: 500 }
    );
  }
}