import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RevealBlock } from "../ui/RevealBlock";
import { analyzeAestheticImage } from "../../services/aestheticAnalysis";

export function AestheticLabSection({ copy, locale }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      setAnalysis(null);
      setError("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  useEffect(() => {
    if (!selectedFile) {
      return undefined;
    }

    let canceled = false;

    async function runAnalysis() {
      setIsAnalyzing(true);
      setError("");

      try {
        const nextAnalysis = await analyzeAestheticImage(selectedFile, locale);

        if (!canceled) {
          setAnalysis(nextAnalysis);
        }
      } catch (analysisError) {
        if (!canceled) {
          setAnalysis(null);
          setError(copy.aestheticLab.analysisError);
          console.error("Aesthetic analysis failed.", analysisError);
        }
      } finally {
        if (!canceled) {
          setIsAnalyzing(false);
        }
      }
    }

    runAnalysis();

    return () => {
      canceled = true;
    };
  }, [selectedFile, locale, copy.aestheticLab.analysisError]);

  const metrics = useMemo(() => {
    const resonance = analysis?.aesthetic_dashboard?.emotional_resonance;

    if (!resonance) {
      return [];
    }

    return [
      {
        key: "melancholy_isolation",
        label: copy.aestheticLab.metricLabels.melancholy_isolation,
        value: resonance.melancholy_isolation,
      },
      {
        key: "power_grit",
        label: copy.aestheticLab.metricLabels.power_grit,
        value: resonance.power_grit,
      },
      {
        key: "mystery_unknown",
        label: copy.aestheticLab.metricLabels.mystery_unknown,
        value: resonance.mystery_unknown,
      },
      {
        key: "intimacy_warmth",
        label: copy.aestheticLab.metricLabels.intimacy_warmth,
        value: resonance.intimacy_warmth,
      },
    ];
  }, [analysis, copy.aestheticLab.metricLabels]);

  function handleFileChange(event) {
    const [nextFile] = Array.from(event.target.files || []);
    if (!nextFile) {
      return;
    }

    setSelectedFile(nextFile);
  }

  function handleReset() {
    setSelectedFile(null);
    setPreviewUrl("");
    setAnalysis(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <section id="aesthetic-lab" className="section-space mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
      <RevealBlock className="mb-8 border-b border-[color:var(--site-border)] pb-6">
        <p className="section-kicker mb-3">{copy.aestheticLab.label}</p>
        <h2 className="editorial-title max-w-[13ch] text-4xl font-semibold sm:text-5xl">
          {copy.aestheticLab.heading}
        </h2>
        <p className="editorial-copy mt-5 max-w-[52rem] text-sm sm:text-[0.95rem]">
          {copy.aestheticLab.text}
        </p>
      </RevealBlock>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-10">
        <RevealBlock className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-5 rounded-[2.2rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] p-7 shadow-soft sm:p-9">
            <div className="min-w-0 flex-1">
              <p className="section-kicker mb-3">{copy.aestheticLab.uploadLabel}</p>
              <h3 className="editorial-title max-w-[11ch] text-4xl font-semibold sm:text-5xl">
                {copy.aestheticLab.uploadHeading}
              </h3>
              <p className="editorial-copy mt-4 max-w-[34rem] text-sm sm:text-[0.95rem]">
                {copy.aestheticLab.uploadText}
              </p>
            </div>

            {selectedFile ? (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-[color:var(--site-border)] px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[color:var(--site-muted)] transition hover:border-[color:var(--site-accent)] hover:text-[color:var(--site-text)]"
              >
                {copy.aestheticLab.replaceImage}
              </button>
            ) : null}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
            <label className="group flex min-h-[360px] cursor-pointer flex-col justify-between overflow-hidden rounded-[1.8rem] border border-dashed border-[color:var(--site-border-strong)] bg-[color:var(--site-bg-deep)]/72 p-4 transition hover:border-[color:var(--site-accent)] sm:min-h-[420px] sm:p-5">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
              />

              {previewUrl ? (
                <div className="relative flex aspect-[4/5] min-h-[250px] w-full items-center justify-center overflow-hidden rounded-[1.35rem] border border-[color:var(--site-border-soft)] bg-black/30 sm:min-h-[320px]">
                  <img
                    src={previewUrl}
                    alt={selectedFile?.name || copy.aestheticLab.previewAlt}
                    className="h-full w-full object-contain"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(10,12,16,0)_0%,rgba(10,12,16,0.88)_100%)] p-4">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
                      {copy.aestheticLab.previewLabel}
                    </p>
                    <p className="mt-2 truncate text-sm text-[color:var(--site-muted-strong)]">
                      {selectedFile?.name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex aspect-[4/5] min-h-[250px] w-full flex-col items-center justify-center rounded-[1.35rem] border border-[color:var(--site-border-soft)] bg-[linear-gradient(180deg,rgba(124,156,255,0.08)_0%,rgba(124,156,255,0.02)_100%)] px-6 text-center sm:min-h-[320px]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-panel)] text-2xl text-[color:var(--site-accent)]">
                    ⬆
                  </div>
                  <p className="mt-6 text-sm uppercase tracking-[0.32em] text-[color:var(--site-accent)]">
                    {copy.aestheticLab.uploadCta}
                  </p>
                  <p className="mt-4 max-w-[18rem] text-sm leading-7 text-[color:var(--site-muted)]">
                    {copy.aestheticLab.uploadHint}
                  </p>
                </div>
              )}

              <div className="mt-5 rounded-[1.35rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/65 p-4">
                <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
                  {copy.aestheticLab.engineLabel}
                </p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--site-muted-strong)]">
                  {isAnalyzing
                    ? copy.aestheticLab.analyzing
                    : selectedFile
                      ? copy.aestheticLab.analysisReady
                      : copy.aestheticLab.awaitingImage}
                </p>
              </div>
            </label>

            <div className="min-w-0 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {metrics.length > 0
                  ? metrics.map((metric, index) => (
                      <motion.article
                        key={metric.key}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.32, ease: "easeOut", delay: index * 0.05 }}
                        className="rounded-[1.5rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-5"
                      >
                        <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
                          {metric.label}
                        </p>
                        <div className="mt-4 flex items-end justify-between gap-4">
                          <div className="text-3xl font-semibold tracking-[-0.06em] text-[color:var(--site-text)] sm:text-4xl">
                            {metric.value}
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-white/[0.05]">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(124,156,255,0.25)_0%,rgba(124,156,255,1)_100%)]"
                              style={{ width: `${metric.value}%` }}
                            />
                          </div>
                        </div>
                      </motion.article>
                    ))
                  : Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`placeholder-${index}`}
                        className="rounded-[1.5rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/55 p-5"
                      >
                        <div className="h-3 w-24 rounded-full bg-white/[0.06]" />
                        <div className="mt-5 h-11 w-20 rounded-[0.8rem] bg-white/[0.05]" />
                        <div className="mt-4 h-2.5 w-full rounded-full bg-white/[0.04]" />
                      </div>
                    ))}
              </div>

              {error ? (
                <p className="status-panel status-panel-error px-4 py-4 text-sm">{error}</p>
              ) : null}

              {!analysis && !error ? (
                <div className="rounded-[1.8rem] border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/65 p-5 text-sm leading-7 text-[color:var(--site-muted)] sm:p-6">
                  {copy.aestheticLab.emptyState}
                </div>
              ) : null}
            </div>
          </div>
        </RevealBlock>

        <RevealBlock delay={90} className="min-w-0">
          {analysis ? (
            <div className="space-y-5">
              <div className="rounded-[2.2rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.02)_100%)] p-7 shadow-soft sm:p-9">
                <p className="section-kicker mb-3">{copy.aestheticLab.readingLabel}</p>
                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-[1.6rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/58 p-5">
                    <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
                      {copy.aestheticLab.colorHeading}
                    </p>
                    <p className="mt-3 text-lg leading-8 text-[color:var(--site-text)] sm:text-[1.12rem]">
                      {analysis.aesthetic_dashboard.color_analysis.dominant_tone}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)] sm:text-[0.95rem]">
                      {analysis.aesthetic_dashboard.color_analysis.visual_weight_breakdown}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted-strong)] sm:text-[0.95rem]">
                      {analysis.aesthetic_dashboard.color_analysis.color_psychology}
                    </p>
                  </div>

                  <div className="rounded-[1.6rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/58 p-5">
                    <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
                      {copy.aestheticLab.lightHeading}
                    </p>
                    <p className="mt-3 text-lg leading-8 text-[color:var(--site-text)] sm:text-[1.12rem]">
                      {analysis.aesthetic_dashboard.lighting_deconstruction.lighting_type}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)] sm:text-[0.95rem]">
                      {analysis.aesthetic_dashboard.lighting_deconstruction.light_ratio_evaluation}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted-strong)] sm:text-[0.95rem]">
                      {analysis.aesthetic_dashboard.lighting_deconstruction.spatial_depth}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
                <div className="rounded-[2rem] border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/68 p-5 shadow-soft sm:p-6">
                  <p className="section-kicker mb-3">{copy.aestheticLab.adviceLabel}</p>
                  <div className="space-y-3">
                    {analysis.aesthetic_dashboard.actionable_advice.map((item) => (
                      <div
                        key={item}
                        className="rounded-[1.2rem] border border-[color:var(--site-border-soft)] bg-white/[0.02] px-4 py-4 text-sm leading-7 text-[color:var(--site-muted-strong)] sm:text-[0.95rem]"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(124,156,255,0.1)_0%,rgba(124,156,255,0.03)_100%)] p-5 shadow-soft sm:p-6">
                  <p className="section-kicker mb-3">{copy.aestheticLab.copyLabel}</p>
                  <p className="max-w-[42rem] text-[0.98rem] leading-8 text-[color:var(--site-text)]/90 sm:text-[1rem]">
                    {analysis.aesthetic_dashboard.social_media_copy}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {Object.entries(analysis.aesthetic_dashboard.platform_recommendations).map(([platform, value]) => (
                  <div
                    key={platform}
                    className="rounded-[2rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.02)_100%)] p-5 shadow-soft sm:p-6"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-[color:var(--site-border-soft)] pb-4">
                      <div>
                        <p className="section-kicker mb-2">
                          {platform === "xiaohongshu"
                            ? copy.aestheticLab.platformLabels.xiaohongshu
                            : copy.aestheticLab.platformLabels.douyin}
                        </p>
                        <h3 className="font-display text-2xl font-semibold tracking-[-0.04em] text-[color:var(--site-text)]">
                          {platform === "xiaohongshu"
                            ? copy.aestheticLab.platformHeadings.xiaohongshu
                            : copy.aestheticLab.platformHeadings.douyin}
                        </h3>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)] sm:text-[0.95rem]">
                      {value.strategy}
                    </p>

                    <div className="mt-5">
                      <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
                        {copy.aestheticLab.recommendedTitlesLabel}
                      </p>
                      <div className="mt-3 space-y-3">
                        {value.titles.map((item) => (
                          <div
                            key={item}
                            className="rounded-[1.2rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/66 px-4 py-4 text-sm leading-7 text-[color:var(--site-text)] sm:text-[0.95rem]"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 rounded-[1.3rem] border border-[color:var(--site-border-soft)] bg-white/[0.02] p-4">
                      <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
                        {copy.aestheticLab.recommendedCaptionLabel}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted-strong)] sm:text-[0.95rem]">
                        {value.caption}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[2.2rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-7 shadow-soft sm:p-9">
              <p className="section-kicker mb-3">{copy.aestheticLab.platformsLabel}</p>
              <h3 className="editorial-title max-w-[12ch] text-4xl font-semibold sm:text-5xl">
                {copy.aestheticLab.platformsHeading}
              </h3>
              <p className="editorial-copy mt-5 max-w-[36rem] text-sm sm:text-[0.95rem]">
                {copy.aestheticLab.platformsText}
              </p>
            </div>
          )}
        </RevealBlock>
      </div>
    </section>
  );
}
