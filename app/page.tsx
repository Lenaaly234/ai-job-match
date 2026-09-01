"use client";

import { useState, type ChangeEvent } from "react";
import ErrorAlert from "@/components/ErrorAlert";

type MatchLevel =
  | "Low Match"
  | "Moderate Match"
  | "Strong Match"
  | "Excellent Match";

type RequirementMatch = {
  requirement: string;
  importance: "required" | "preferred";
  matchStrength: "full" | "partial" | "none";
  matched: boolean;
  evidence: string;
};

type AnalysisResult = {
  matchScore: number;
  matchLevel: MatchLevel;
  summary: string;
  requirements: RequirementMatch[];
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  recommendations: string[];
};

export default function Home() {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  function validateAndSetFile(file: File) {
    setError("");
    setAnalysis(null);

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setCvFile(null);
      setError("Please upload your CV as a PDF file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setCvFile(null);
      setError("Your PDF must be smaller than 5 MB.");
      return;
    }

    setCvFile(file);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    validateAndSetFile(file);
  }

  function handleRemoveFile() {
    setCvFile(null);
    setError("");
    setAnalysis(null);
  }

  async function handleAnalyze() {
    setError("");
    setAnalysis(null);

    if (!cvFile) {
      setError("Please upload your CV as a PDF.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please add the job description.");
      return;
    }

    try {
      setIsAnalyzing(true);

      /*
       * STEP 1
       * Send PDF to our server and extract its text.
       */
      const formData = new FormData();
      formData.append("cv", cvFile);

      const extractResponse = await fetch("/api/extract-cv", {
        method: "POST",
        body: formData,
      });

      const extractData = await extractResponse.json();

      if (!extractResponse.ok) {
        throw new Error(
          extractData.error || "Unable to read the CV."
        );
      }

      const cvText = extractData.text;

      if (!cvText) {
        throw new Error(
          "No readable text could be extracted from the CV."
        );
      }

      /*
       * STEP 2
       * Send CV text + job description to our Gemini API route.
       */
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cvText,
          jobDescription,
        }),
      });

      const analyzeData = await analyzeResponse.json();

      if (!analyzeResponse.ok) {
        throw new Error(
          analyzeData.error ||
            "We couldn't complete the AI analysis."
        );
      }

      if (!analyzeData.analysis) {
        throw new Error(
          "The AI returned an invalid analysis."
        );
      }

      setAnalysis(analyzeData.analysis);

      /*
       * Scroll down automatically once the result appears.
       */
      setTimeout(() => {
        document
          .getElementById("results")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 150);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while analyzing your CV."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function getMatchBadgeStyle(level: MatchLevel) {
    switch (level) {
      case "Excellent Match":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "Strong Match":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "Moderate Match":
        return "border-amber-200 bg-amber-50 text-amber-700";

      default:
        return "border-red-200 bg-red-50 text-red-700";
    }
  }

  function getRequirementStatus(
    strength: RequirementMatch["matchStrength"]
  ) {
    if (strength === "full") {
      return {
        label: "Full match",
        badge:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        card:
          "border-emerald-100 bg-emerald-50/30",
        dot: "bg-emerald-500",
      };
    }

    if (strength === "partial") {
      return {
        label: "Partial match",
        badge:
          "border-amber-200 bg-amber-50 text-amber-700",
        card:
          "border-amber-100 bg-amber-50/30",
        dot: "bg-amber-500",
      };
    }

    return {
      label: "Gap",
      badge:
        "border-red-200 bg-red-50 text-red-700",
      card:
        "border-red-100 bg-red-50/30",
      dot: "bg-red-500",
    };
  }

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[#f7f8fc] text-slate-900"
    >
      {/* Skip link */}
      <a
        href="#analyzer"
        className="sr-only z-50 rounded-lg bg-slate-950 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to analyzer
      </a>

      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-250px] h-[550px] w-[900px] -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl" />

        <div className="absolute right-[-200px] top-[300px] h-[400px] w-[400px] rounded-full bg-violet-200/30 blur-3xl" />
      </div>

      <div className="relative">
        {/* Navigation */}
        <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3L14.2 9.8L21 12L14.2 14.2L12 21L9.8 14.2L3 12L9.8 9.8L12 3Z"
                    fill="currentColor"
                  />
                </svg>
              </div>

              <div>
                <p className="text-sm font-bold tracking-tight">
                  AI JOB MATCH
                </p>

                <p className="text-xs text-slate-500">
                  Intelligent career analysis
                </p>
              </div>
            </div>

            <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 sm:flex">
              <a
                href="#analyzer"
                className="transition hover:text-slate-950"
              >
                Analyzer
              </a>

              <a
                href="#how-it-works"
                className="transition hover:text-slate-950"
              >
                How it works
              </a>

              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                Gemini Powered
              </span>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 pb-10 pt-20 text-center lg:pt-24">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-600" />

            Apply with more confidence
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
            See how well your CV

            <span className="block bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              matches the opportunity.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Upload your CV and compare it against any job description
            to receive an AI-powered breakdown of matching skills,
            gaps, strengths, and actionable improvements.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-700">
            <span className="flex items-center gap-2">
              <span className="text-emerald-600">✓</span>
              No account required
            </span>

            <span className="flex items-center gap-2">
              <span className="text-emerald-600">✓</span>
              Structured AI analysis
            </span>

            <span className="flex items-center gap-2">
              <span className="text-emerald-600">✓</span>
              Built for job seekers
            </span>
          </div>
        </section>

        {/* Analyzer */}
        <section
          id="analyzer"
          aria-busy={isAnalyzing}
          className="mx-auto max-w-6xl scroll-mt-6 px-6 pb-20 lg:px-8"
        >
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.25)]">
            {/* Header */}
            <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-950">
                    Job Match Analyzer
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Upload your CV and add the job description to
                    generate your personalized analysis.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isAnalyzing
                        ? "animate-pulse bg-amber-500"
                        : analysis
                          ? "bg-blue-500"
                          : "bg-emerald-500"
                    }`}
                  />

                  {isAnalyzing
                    ? "AI analyzing..."
                    : analysis
                      ? "Analysis complete"
                      : "Ready to analyze"}
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid gap-0 lg:grid-cols-2">
              {/* CV */}
              <div className="border-b border-slate-200 p-6 sm:p-8 lg:border-b-0 lg:border-r">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Your CV
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Upload the CV you want evaluated.
                    </p>
                  </div>

                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Step 01
                  </span>
                </div>

                {!cvFile ? (
                  <label
                    htmlFor="cv-upload"
                    className="group flex min-h-[310px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-6 text-center transition hover:border-blue-400 hover:bg-blue-50/40 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100"
                  >
                    <input
                      id="cv-upload"
                      name="cv-upload"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      disabled={isAnalyzing}
                      className="sr-only"
                      aria-describedby="cv-upload-help"
                    />

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition group-hover:text-blue-600">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 16V4M12 4L7.5 8.5M12 4L16.5 8.5M5 14V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V14"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <p className="mt-5 text-sm font-bold text-slate-900">
                      Upload your CV
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Select a PDF from your computer.
                    </p>

                    <span className="mt-5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                      Choose PDF
                    </span>

                    <p
                      id="cv-upload-help"
                      className="mt-5 text-xs text-slate-600"
                    >
                      PDF only • Maximum file size 5 MB
                    </p>
                  </label>
                ) : (
                  <div className="flex min-h-[310px] flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50/50 px-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl font-bold text-emerald-700">
                      ✓
                    </div>

                    <p className="mt-5 text-sm font-bold text-slate-900">
                      CV uploaded successfully
                    </p>

                    <div className="mt-4 w-full max-w-sm rounded-xl border border-emerald-200 bg-white px-4 py-3 text-left shadow-sm">
                      <p
                        className="truncate text-sm font-semibold text-slate-800"
                        title={cvFile.name}
                      >
                        {cvFile.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        {(cvFile.size / 1024 / 1024).toFixed(2)} MB •
                        PDF
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      disabled={isAnalyzing}
                      className="mt-5 text-xs font-bold text-slate-500 underline-offset-4 transition hover:text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove file
                    </button>
                  </div>
                )}

                <p className="mt-3 text-xs leading-5 text-slate-600">
                  This app does not save your CV. Its extracted text is
                  sent to the configured AI provider to generate the
                  analysis.
                </p>
              </div>

              {/* Job description */}
              <div className="p-6 sm:p-8">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <label
                      htmlFor="job"
                      className="block text-sm font-bold text-slate-900"
                    >
                      Job Description
                    </label>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Paste the role requirements and responsibilities.
                    </p>
                  </div>

                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-600">
                    Step 02
                  </span>
                </div>

                <textarea
                  id="job"
                  name="job"
                  value={jobDescription}
                  disabled={isAnalyzing}
                  onChange={(e) => {
                    setJobDescription(e.target.value);
                    setError("");
                    setAnalysis(null);
                  }}
                  rows={13}
                  placeholder={`Example:\n\nWe're looking for a Sales Engineer with experience in technical solutions, customer requirements, proposals, and engineering systems...`}
                  className="min-h-[310px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-3 text-xs text-slate-600">
                  Include the complete requirements for a more accurate
                  comparison.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-6 sm:px-8">
{error && <ErrorAlert message={error} />}
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {isAnalyzing
                      ? "Gemini is reviewing the match..."
                      : "Ready when you are."}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    The analysis compares only the information provided.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto"
                >
                  {isAnalyzing ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="opacity-25"
                        />

                        <path
                          d="M21 12A9 9 0 0 0 12 3"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>

                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10L12 3Z"
                          fill="currentColor"
                        />
                      </svg>

                      Analyze Match

                      <span
                        className="transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* RESULTS */}
        {analysis && (
          <section
            id="results"
            aria-live="polite"
            className="mx-auto max-w-6xl scroll-mt-6 px-6 pb-24 lg:px-8"
          >
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Analysis complete
              </div>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                Your Match Report
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                AI-generated comparison based on the CV and job
                description you provided.
              </p>
            </div>

            {/* Score + summary */}
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
                  Alignment score
                </p>

                <div className="relative mx-auto mt-7 flex h-48 w-48 items-center justify-center">
                  <svg
                    viewBox="0 0 120 120"
                    className="h-full w-full -rotate-90"
                    aria-hidden="true"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      strokeWidth="8"
                      className="stroke-slate-100"
                    />

                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      strokeWidth="8"
                      strokeLinecap="round"
                      pathLength="100"
                      strokeDasharray="100"
                      strokeDashoffset={100 - analysis.matchScore}
                      className="stroke-blue-600 transition-all duration-700"
                    />
                  </svg>

                  <div className="absolute text-center">
                    <p className="text-4xl font-bold tracking-tight text-slate-950">
                      {analysis.matchScore}%
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-600">
                      alignment
                    </p>
                  </div>
                </div>

                <div className="mt-5 text-center">
                  <span
                    className={`inline-flex rounded-full border px-4 py-2 text-xs font-bold ${getMatchBadgeStyle(
                      analysis.matchLevel
                    )}`}
                  >
                    {analysis.matchLevel}
                  </span>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                  AI Summary
                </p>

                <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
                  How your CV aligns with this role
                </h3>

                <p className="mt-5 text-base leading-8 text-slate-600">
                  {analysis.summary}
                </p>

                <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
                  <p className="text-xs leading-5 text-slate-500">
                    The alignment score is an AI-assisted comparison,
                    not a hiring decision or prediction. Employers may
                    evaluate factors that are not present in the job
                    description.
                  </p>
                </div>
              </div>
            </div>

            {/* Requirement evidence */}
            {analysis.requirements?.length > 0 && (
              <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                      Evidence Breakdown
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-slate-950">
                      Requirement-by-requirement analysis
                    </h3>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      See what the job asks for, how strongly your CV supports it,
                      and the evidence used in the analysis.
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        {
                          analysis.requirements.filter(
                            (item) => item.matchStrength === "full"
                          ).length
                        }{" "}
                        Full
                      </span>

                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                        {
                          analysis.requirements.filter(
                            (item) => item.matchStrength === "partial"
                          ).length
                        }{" "}
                        Partial
                      </span>

                      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
                        {
                          analysis.requirements.filter(
                            (item) => item.matchStrength === "none"
                          ).length
                        }{" "}
                        Gaps
                      </span>

                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
                        {analysis.requirements.length} reviewed
                      </span>
                    </div>

                    <p className="max-w-sm text-left text-[11px] leading-5 text-slate-600 sm:text-right">
                      Scores are conservatively calibrated and may remain below 100%
                      even when all listed requirements are supported.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {analysis.requirements.map((item, index) => {
                    const status = getRequirementStatus(
                      item.matchStrength
                    );

                    return (
                      <div
                        key={`${item.requirement}-${index}`}
                        className={`rounded-2xl border p-5 ${status.card}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span
                              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${status.dot}`}
                              aria-hidden="true"
                            />

                            <div>
                              <p className="text-sm font-bold leading-6 text-slate-900">
                                {item.requirement}
                              </p>

                              <span
                                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                                  item.importance === "required"
                                    ? "border-slate-300 bg-slate-100 text-slate-700"
                                    : "border-blue-200 bg-blue-50 text-blue-700"
                                }`}
                              >
                                {item.importance === "required"
                                  ? "Required"
                                  : "Preferred"}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold ${status.badge}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="mt-4 rounded-xl border border-white/80 bg-white/80 px-4 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
                            CV evidence
                          </p>

                          <p className="mt-1.5 text-sm leading-6 text-slate-600">
                            {item.evidence}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Skills */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Matching */}
              <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
                    ✓
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-950">
                      Matching Skills
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Relevant capabilities identified in your CV.
                    </p>
                  </div>
                </div>

                <ul className="mt-6 space-y-3">
                  {analysis.matchingSkills.length > 0 ? (
                    analysis.matchingSkills.map((skill) => (
                      <li
                        key={skill}
                        className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm text-slate-700"
                      >
                        <span
                          className="mt-0.5 text-emerald-600"
                          aria-hidden="true"
                        >
                          ✓
                        </span>

                        <span>{skill}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">
                      No direct skill matches were identified.
                    </li>
                  )}
                </ul>
              </div>

              {/* Missing */}
              <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 font-bold text-amber-700">
                    !
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-950">
                      Skill Gaps
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Requirements not clearly demonstrated by your CV.
                    </p>
                  </div>
                </div>

                <ul className="mt-6 space-y-3">
                  {analysis.missingSkills.length > 0 ? (
                    analysis.missingSkills.map((skill) => (
                      <li
                        key={skill}
                        className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3 text-sm text-slate-700"
                      >
                        <span
                          className="mt-0.5 text-amber-600"
                          aria-hidden="true"
                        >
                          →
                        </span>

                        <span>{skill}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">
                      No significant skill gaps were identified.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Strengths */}
            <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
                  Your Advantages
                </p>

                <h3 className="mt-2 text-xl font-bold text-slate-950">
                  CV Strengths
                </h3>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {analysis.strengths.map((strength, index) => (
                  <div
                    key={`${strength}-${index}`}
                    className="rounded-2xl border border-violet-100 bg-violet-50/40 p-5"
                  >
                    <span className="text-xs font-bold text-violet-600">
                      0{index + 1}
                    </span>

                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {strength}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-6 overflow-hidden rounded-[28px] bg-slate-950 text-white shadow-xl">
              <div className="border-b border-white/10 px-7 py-6 sm:px-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                  Action Plan
                </p>

                <h3 className="mt-2 text-2xl font-bold">
                  AI Recommendations
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Practical improvements you can consider before
                  applying.
                </p>
              </div>

              <div className="divide-y divide-white/10">
                {analysis.recommendations.map(
                  (recommendation, index) => (
                    <div
                      key={`${recommendation}-${index}`}
                      className="flex gap-5 px-7 py-6 sm:px-8"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-blue-300">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <p className="pt-1 text-sm leading-7 text-slate-200">
                        {recommendation}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* How it works */}
        <section
          id="how-it-works"
          className="border-t border-slate-200 bg-white"
        >
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Upload your CV",
                  description:
                    "Add your CV as a PDF so the application can extract your experience, projects, education, and skills.",
                },
                {
                  number: "02",
                  title: "Add the opportunity",
                  description:
                    "Paste the job description so the AI can understand the role's responsibilities and requirements.",
                },
                {
                  number: "03",
                  title: "Get your analysis",
                  description:
                    "Gemini compares both and returns structured insights about alignment, gaps, strengths, and improvements.",
                },
              ].map((item) => (
                <div key={item.number}>
                  <p className="text-xs font-bold tracking-[0.2em] text-blue-600">
                    {item.number}
                  </p>

                  <h3 className="mt-3 text-lg font-bold text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <p>AI Job Match</p>

            <p>
              Next.js • Structured AI analysis powered by Gemini
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}