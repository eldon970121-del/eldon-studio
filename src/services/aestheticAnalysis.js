function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toPercent(value) {
  return Math.round(clamp(value, 0, 1) * 100);
}

function rgbToHsl(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (max !== min) {
    const delta = max - min;
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        hue = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / delta + 2;
        break;
      default:
        hue = (r - g) / delta + 4;
        break;
    }

    hue /= 6;
  }

  return {
    hue: hue * 360,
    saturation,
    lightness,
  };
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("image-load-failed"));
    };

    image.src = objectUrl;
  });
}

function sampleImage(image) {
  const maxDimension = 160;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
  const width = Math.max(24, Math.round((image.naturalWidth || image.width) * scale));
  const height = Math.max(24, Math.round((image.naturalHeight || image.height) * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("canvas-context-unavailable");
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  return {
    width,
    height,
    data: context.getImageData(0, 0, width, height).data,
  };
}

function buildStats(sample) {
  const { width, height, data } = sample;
  const totalPixels = width * height;
  let warmPixels = 0;
  let coolPixels = 0;
  let vividPixels = 0;
  let shadowPixels = 0;
  let highlightPixels = 0;
  let luminanceSum = 0;
  let luminanceSquareSum = 0;
  let saturationSum = 0;
  let hueCos = 0;
  let hueSin = 0;
  let leftLuminance = 0;
  let rightLuminance = 0;
  let topLuminance = 0;
  let bottomLuminance = 0;
  let centerLuminance = 0;
  let edgeLuminance = 0;
  let centerPixels = 0;
  let edgePixels = 0;

  for (let index = 0; index < data.length; index += 4) {
    const pixelIndex = index / 4;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3] / 255;

    if (alpha < 0.1) {
      continue;
    }

    const { hue, saturation, lightness } = rgbToHsl(red, green, blue);
    const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
    luminanceSum += luminance;
    luminanceSquareSum += luminance * luminance;
    saturationSum += saturation;
    hueCos += Math.cos((hue * Math.PI) / 180);
    hueSin += Math.sin((hue * Math.PI) / 180);

    if ((hue >= 18 && hue <= 72) || hue >= 330 || hue <= 12) {
      warmPixels += 1;
    } else if (hue >= 165 && hue <= 265) {
      coolPixels += 1;
    }

    if (saturation >= 0.45) {
      vividPixels += 1;
    }

    if (luminance <= 0.22) {
      shadowPixels += 1;
    } else if (luminance >= 0.78) {
      highlightPixels += 1;
    }

    if (x < width / 2) {
      leftLuminance += luminance;
    } else {
      rightLuminance += luminance;
    }

    if (y < height / 2) {
      topLuminance += luminance;
    } else {
      bottomLuminance += luminance;
    }

    const normalizedX = x / Math.max(width - 1, 1);
    const normalizedY = y / Math.max(height - 1, 1);
    const distanceX = Math.abs(normalizedX - 0.5);
    const distanceY = Math.abs(normalizedY - 0.5);

    if (distanceX < 0.22 && distanceY < 0.22) {
      centerLuminance += luminance;
      centerPixels += 1;
    }

    if (distanceX > 0.36 || distanceY > 0.36) {
      edgeLuminance += luminance;
      edgePixels += 1;
    }
  }

  const averageLuminance = luminanceSum / totalPixels;
  const averageSaturation = saturationSum / totalPixels;
  const luminanceVariance =
    luminanceSquareSum / totalPixels - averageLuminance * averageLuminance;
  const luminanceStd = Math.sqrt(Math.max(luminanceVariance, 0));
  const averageHue = (Math.atan2(hueSin, hueCos) * 180) / Math.PI;
  const normalizedHue = averageHue < 0 ? averageHue + 360 : averageHue;

  return {
    averageHue: normalizedHue,
    averageLuminance,
    averageSaturation,
    luminanceStd,
    warmRatio: warmPixels / totalPixels,
    coolRatio: coolPixels / totalPixels,
    vividRatio: vividPixels / totalPixels,
    shadowRatio: shadowPixels / totalPixels,
    highlightRatio: highlightPixels / totalPixels,
    leftLuminance: leftLuminance / totalPixels * 2,
    rightLuminance: rightLuminance / totalPixels * 2,
    topLuminance: topLuminance / totalPixels * 2,
    bottomLuminance: bottomLuminance / totalPixels * 2,
    centerLuminance: centerPixels > 0 ? centerLuminance / centerPixels : averageLuminance,
    edgeLuminance: edgePixels > 0 ? edgeLuminance / edgePixels : averageLuminance,
  };
}

function describeDominantTone(stats, locale) {
  const saturationLabel =
    stats.averageSaturation < 0.24
      ? locale === "zh"
        ? "低饱和"
        : "low-saturation"
      : stats.averageSaturation < 0.42
        ? locale === "zh"
          ? "柔雾感"
          : "muted"
        : locale === "zh"
          ? "高色能"
          : "high-energy";

  const brightnessLabel =
    stats.averageLuminance < 0.34
      ? locale === "zh"
        ? "暗调"
        : "shadow-heavy"
      : stats.averageLuminance < 0.62
        ? locale === "zh"
          ? "中灰"
          : "midtone"
        : locale === "zh"
          ? "高亮"
          : "bright";

  let temperatureLabel;
  if (stats.coolRatio > stats.warmRatio + 0.08) {
    temperatureLabel = locale === "zh" ? "冷青灰" : "cool cyan-gray";
  } else if (stats.warmRatio > stats.coolRatio + 0.08) {
    temperatureLabel = locale === "zh" ? "暖琥珀肤光" : "warm amber skin-light";
  } else if (stats.averageHue >= 180 && stats.averageHue <= 250) {
    temperatureLabel = locale === "zh" ? "中性蓝灰" : "neutral blue-gray";
  } else {
    temperatureLabel = locale === "zh" ? "中性胶片灰" : "neutral film gray";
  }

  return locale === "zh"
    ? `${saturationLabel}${temperatureLabel}${brightnessLabel}`
    : `${saturationLabel} ${temperatureLabel} ${brightnessLabel}`;
}

function describeVisualWeight(stats, locale) {
  const warmPercent = toPercent(stats.warmRatio);
  const coolPercent = toPercent(stats.coolRatio);
  const centerLead = toPercent(clamp(stats.centerLuminance - stats.edgeLuminance + 0.5, 0, 1));

  if (locale === "zh") {
    return `暖色约占 ${warmPercent}% ，冷色约占 ${coolPercent}% 。画面中心亮度相对边缘更集中，视觉重力向人物或主体内收，压迫感与凝视感被明显放大。中心控制强度约 ${centerLead}%。`;
  }

  return `Warm notes hold roughly ${warmPercent}% of the frame while cool passages occupy about ${coolPercent}%. The center reads perceptibly brighter than the perimeter, so visual gravity contracts inward and intensifies psychological pressure around the subject. Center pull strength lands near ${centerLead}%.`;
}

function describeColorPsychology(stats, locale) {
  const melancholy = toPercent(
    clamp(
      stats.coolRatio * 0.42 +
        (1 - stats.averageSaturation) * 0.26 +
        stats.shadowRatio * 0.22 +
        (0.55 - stats.averageLuminance) * 0.18,
      0,
      1,
    ),
  );

  if (locale === "zh") {
    if (stats.warmRatio > stats.coolRatio + 0.12 && stats.averageLuminance > 0.48) {
      return "暖部没有彻底释放，而是被克制地压在安全边界内，因此亲密感里仍保留了节制与专业距离。";
    }

    if (stats.coolRatio > stats.warmRatio + 0.08) {
      return `冷色占优且饱和度被压低，情绪读感更接近疏离、克制与慢性忧郁，孤独回响强度约 ${melancholy}%。`;
    }

    return "色彩没有选择直接煽情，而是通过中性灰阶与微弱色偏维持一种含蓄、悬而未决的心理张力。";
  }

  if (stats.warmRatio > stats.coolRatio + 0.12 && stats.averageLuminance > 0.48) {
    return "Warmth never spills into sentimentality; it stays disciplined, so intimacy arrives with restraint and professional distance still intact.";
  }

  if (stats.coolRatio > stats.warmRatio + 0.08) {
    return `Cool dominance and suppressed saturation push the frame toward distance, restraint, and slow melancholy, with an isolation resonance near ${melancholy}%.`;
  }

  return "The palette avoids overt sentiment and instead sustains a suspended psychological tension through neutral grays and slight chromatic hesitation.";
}

function describeLightingType(stats, locale) {
  const leftRightGap = Math.abs(stats.leftLuminance - stats.rightLuminance);
  const topBottomGap = Math.abs(stats.topLuminance - stats.bottomLuminance);
  const centerLift = stats.centerLuminance - stats.edgeLuminance;

  if (leftRightGap > 0.14 && stats.luminanceStd > 0.18) {
    return locale === "zh" ? "分割式侧光" : "split sidelight";
  }

  if (stats.edgeLuminance > stats.centerLuminance + 0.06 && stats.highlightRatio > 0.08) {
    return locale === "zh" ? "侧逆光轮廓" : "side-back rim light";
  }

  if (topBottomGap > 0.11 && stats.topLuminance > stats.bottomLuminance) {
    return locale === "zh" ? "顶侧塑形光" : "top-side sculpting light";
  }

  if (centerLift > 0.09 && leftRightGap < 0.08) {
    return locale === "zh" ? "蝴蝶式正面光变体" : "butterfly-inspired frontal light";
  }

  return locale === "zh" ? "柔性窗侧光" : "soft window sidelight";
}

function describeLightRatio(stats, locale) {
  const contrastScore = toPercent(clamp(stats.luminanceStd * 2.3, 0, 1));

  if (locale === "zh") {
    if (stats.luminanceStd > 0.22 || stats.shadowRatio > 0.42) {
      return `光比偏高，明暗断层清晰，戏剧张力强度约 ${contrastScore}%。这种反差会把人物从环境里硬性切出来，带来神秘感、坚硬感与心理防御。`;
    }

    if (stats.luminanceStd < 0.14) {
      return `光比偏低，中间调过渡更连续，亲密度与可接近性更高，冲突感被压低到约 ${contrastScore}% 。`;
    }

    return `光比处于中高区间，既保留面部体积，也维持了一定对抗感，叙事更像压着情绪前进而不是直接爆发。`;
  }

  if (stats.luminanceStd > 0.22 || stats.shadowRatio > 0.42) {
    return `The light ratio runs high, with a clear tonal fracture and dramatic tension around ${contrastScore}%. That contrast cuts the subject out of the environment and introduces mystery, grit, and psychological defense.`;
  }

  if (stats.luminanceStd < 0.14) {
    return `The light ratio stays low, so the midtones travel more gently and the frame feels more approachable; conflict pressure drops to roughly ${contrastScore}%.`;
  }

  return "The ratio sits in a controlled mid-high zone: enough volume to sculpt the face, enough resistance to keep the emotional surface slightly guarded.";
}

function describeSpatialDepth(stats, locale) {
  const edgeFalloff = toPercent(clamp((stats.centerLuminance - stats.edgeLuminance) * 2.2, 0, 1));

  if (locale === "zh") {
    if (stats.centerLuminance > stats.edgeLuminance + 0.08) {
      return `边缘亮度明显低于中心，视线会被暗角式衰减收回主体，空间纵深主要靠“中心亮、四周沉”建立，收束强度约 ${edgeFalloff}%。`;
    }

    if (Math.abs(stats.leftLuminance - stats.rightLuminance) > 0.12) {
      return "光线从单侧衰减，画面会自动形成一条视觉推进轴线，观众会沿着亮部向暗部阅读，空间因此更具戏剧性与窥视感。";
    }

    return "整体深度并非靠强烈透视，而是靠微妙的亮暗层级递减维持，因此画面更像在安静包围主体。";
  }

  if (stats.centerLuminance > stats.edgeLuminance + 0.08) {
    return `The perimeter sits perceptibly darker than the center, so the eye is cinched back toward the subject through a vignette-like falloff. Depth is built through central lift and peripheral withdrawal, with a pull strength near ${edgeFalloff}%.`;
  }

  if (Math.abs(stats.leftLuminance - stats.rightLuminance) > 0.12) {
    return "The light decays across one side of the frame, creating a directional reading path from exposure into shadow; that movement adds depth, drama, and a faint voyeuristic tension.";
  }

  return "Depth here is not forced by aggressive perspective; it survives through quieter tonal recession, so the subject feels surrounded rather than theatrically separated.";
}

function buildAdvice(stats, locale) {
  const advice = [];

  if (locale === "zh") {
    if (stats.coolRatio >= stats.warmRatio) {
      advice.push("后期可在阴影加入更轻微的青蓝分离色调，同时压低蓝青饱和度，让疏离感更高级而非廉价偏色。");
    } else {
      advice.push("保留肤色暖部，但把橙黄通道的亮度微降 3%-6%，让温暖停留在亲密边界，不要滑向商业糖水感。");
    }

    if (stats.luminanceStd < 0.18) {
      advice.push("可轻微压深非主体侧阴影，并只在主体高光区提亮半级，以拉开体积关系和心理焦点。");
    } else {
      advice.push("避免继续粗暴拉对比，改用局部 dodge & burn 清理亮面过渡，让戏剧性更像结构而不是滤镜。");
    }
  } else {
    if (stats.coolRatio >= stats.warmRatio) {
      advice.push("Push a gentler cyan split into the shadows while trimming blue saturation, so the distance feels expensive and controlled rather than visibly over-graded.");
    } else {
      advice.push("Keep the warmth in the skin, but lower orange-yellow luminance by 3%-6% so intimacy stays poised and never slips into a sugary commercial glow.");
    }

    if (stats.luminanceStd < 0.18) {
      advice.push("Deepen the non-subject shadow side slightly and lift the subject highlights by half a stop to strengthen volume and psychological focus.");
    } else {
      advice.push("Do not force more global contrast; refine the bright-to-dark transition with local dodge and burn so the drama reads as structure, not as a preset.");
    }
  }

  return advice;
}

function buildSocialCopy(stats, locale) {
  if (locale === "zh") {
    if (stats.coolRatio > stats.warmRatio) {
      return "不是把人放进光里，而是让沉默先占据空气。冷部缓慢收拢，暖部只留下极少量呼吸，于是故事没有喊出来，却在阴影里持续发声。";
    }

    return "光线没有急着取悦任何人，它只是轻轻落在皮肤和空气之间，让亲密停在将近触碰的距离里。情绪不喧哗，却足够长久。";
  }

  if (stats.coolRatio > stats.warmRatio) {
    return "This frame does not place a person inside light so much as let silence settle first. Cool shadow closes in, warmth survives only as breath, and the story speaks from the places that refuse to explain themselves.";
  }

  return "The light never rushes to flatter. It rests between skin and air, keeping intimacy one step short of touch, where emotion stops performing and begins to remain.";
}

function buildMoodDescriptors(stats, locale) {
  const isCool = stats.coolRatio > stats.warmRatio + 0.05;
  const isWarm = stats.warmRatio > stats.coolRatio + 0.05;
  const highContrast = stats.luminanceStd > 0.2 || stats.shadowRatio > 0.38;

  if (locale === "zh") {
    return {
      mood: isCool ? "冷感克制" : isWarm ? "亲密留白" : "中性悬停",
      scene: highContrast ? "电影感肖像" : "安静肖像",
      promise: isCool
        ? "把疏离感拍得更高级"
        : isWarm
          ? "把亲密感压在高级边界内"
          : "把情绪张力留在画面里",
      hook: highContrast ? "前 2 秒先给情绪冲突" : "前 2 秒先给氛围钩子",
    };
  }

  return {
    mood: isCool ? "cool restraint" : isWarm ? "intimate restraint" : "suspended neutrality",
    scene: highContrast ? "cinematic portrait" : "quiet portrait",
    promise: isCool
      ? "how to make distance feel expensive"
      : isWarm
        ? "how to hold intimacy inside a premium frame"
        : "how to keep tension inside a frame",
    hook: highContrast ? "open with conflict in the first two seconds" : "open with atmosphere in the first two seconds",
  };
}

function buildPlatformRecommendations(stats, locale) {
  const descriptors = buildMoodDescriptors(stats, locale);
  const dominantTone = describeDominantTone(stats, locale);

  if (locale === "zh") {
    return {
      xiaohongshu: {
        strategy:
          "更适合“搜索词 + 场景词 + 结果感”的标题结构。封面与标题需要先让人知道这条笔记解决什么审美问题，正文则要保留可收藏的信息密度。",
        titles: [
          `${descriptors.scene}怎么拍出${descriptors.mood}感？`,
          `这组${dominantTone}照片，为什么一眼就有情绪张力`,
          `${descriptors.promise}，我会先从光线和色彩下手`,
        ],
        caption:
          `适合小红书的文案重心是“可保存、可复用、可解释”。开头先点明这组画面的核心气质是${descriptors.mood}，中段拆颜色与布光为什么成立，结尾补一句适合的人群或拍摄场景，让用户更容易收藏和二次搜索。`,
      },
      douyin: {
        strategy:
          "更适合“短钩子 + 冲突词 + 结果承诺”的结构。前几秒先给情绪差异或前后反差，再用更短的句子推进完播。",
        titles: [
          `同样是肖像，为什么这张更有压迫感`,
          `别再把${descriptors.mood}拍成没情绪了`,
          `${descriptors.hook}，这张照片才会被看完`,
        ],
        caption:
          `适合抖音的文案要更短、更像口播。第一句直接抛出画面冲突点，第二句解释是色彩还是光比在起作用，第三句给一个结果感收口，例如“所以这张图才会让人停住”。`,
      },
    };
  }

  return {
    xiaohongshu: {
      strategy:
        "Best framed around searchable phrases, scene intent, and a clear takeaway. The cover and title should tell the reader what aesthetic problem the post resolves, while the body should feel worth saving.",
      titles: [
        `How do you shoot a ${descriptors.mood} portrait without losing control?`,
        `Why this ${dominantTone} frame lands with instant emotional tension`,
        `${descriptors.promise}: start with light, then shape color`,
      ],
      caption:
        `For Xiaohongshu, write for saving and search. Open by naming the frame's emotional center, then explain why the color and light structure work, and close with a usable scenario so the post feels worth bookmarking.`,
    },
    douyin: {
      strategy:
        "Best driven by a quick hook, a visible tension point, and a promise of payoff. The first seconds should introduce contrast, then the caption should move in short spoken beats that support completion.",
      titles: [
        `Why does this portrait feel more intense than the others?`,
        `Stop shooting restraint like it has no emotion`,
        `${descriptors.hook}, or the frame won't hold attention`,
      ],
      caption:
        `For Douyin, the caption should read like spoken pacing. Start with the emotional conflict, then name whether color or light ratio is doing the work, and end with a payoff line that makes the viewer stay to the last beat.`,
    },
  };
}

function buildDashboard(stats, locale) {
  const melancholyIsolation = toPercent(
    clamp(
      stats.coolRatio * 0.48 +
        (1 - stats.averageSaturation) * 0.18 +
        stats.shadowRatio * 0.22 +
        (0.58 - stats.averageLuminance) * 0.18,
      0,
      1,
    ),
  );
  const powerGrit = toPercent(
    clamp(
      stats.luminanceStd * 1.55 +
        Math.abs(stats.leftLuminance - stats.rightLuminance) * 1.1 +
        stats.shadowRatio * 0.28,
      0,
      1,
    ),
  );
  const mysteryUnknown = toPercent(
    clamp(
      stats.shadowRatio * 0.44 +
        stats.luminanceStd * 1.1 +
        (stats.centerLuminance - stats.edgeLuminance) * 0.75 +
        stats.coolRatio * 0.2,
      0,
      1,
    ),
  );
  const intimacyWarmth = toPercent(
    clamp(
      stats.warmRatio * 0.5 +
        stats.averageLuminance * 0.18 +
        (0.28 - stats.luminanceStd) * 0.45 +
        (1 - stats.shadowRatio) * 0.16,
      0,
      1,
    ),
  );

  return {
    aesthetic_dashboard: {
      emotional_resonance: {
        melancholy_isolation: melancholyIsolation,
        power_grit: powerGrit,
        mystery_unknown: mysteryUnknown,
        intimacy_warmth: intimacyWarmth,
      },
      color_analysis: {
        dominant_tone: describeDominantTone(stats, locale),
        visual_weight_breakdown: describeVisualWeight(stats, locale),
        color_psychology: describeColorPsychology(stats, locale),
      },
      lighting_deconstruction: {
        lighting_type: describeLightingType(stats, locale),
        light_ratio_evaluation: describeLightRatio(stats, locale),
        spatial_depth: describeSpatialDepth(stats, locale),
      },
      actionable_advice: buildAdvice(stats, locale),
      social_media_copy: buildSocialCopy(stats, locale),
      platform_recommendations: buildPlatformRecommendations(stats, locale),
    },
  };
}

function calcMaturityFromResonance(resonance) {
  return Math.round(
    (resonance.melancholy_isolation || 0) * 0.32 +
      (resonance.mystery_unknown || 0) * 0.38 +
      (resonance.power_grit || 0) * 0.18 +
      (resonance.intimacy_warmth || 0) * 0.12,
  );
}

function getSeriesCoherenceBand(std) {
  if (std < 15) return "high";
  if (std <= 25) return "medium";
  return "varied";
}

function getSeriesDirectionLabel(dominant, coherence, locale) {
  const labels = locale === "zh"
    ? {
        melancholy_isolation: {
          high: "冷寂内收",
          medium: "疏离悬停",
          varied: "冷感游移",
        },
        mystery_unknown: {
          high: "雾面悬疑",
          medium: "暗涌未知",
          varied: "多面谜场",
        },
        power_grit: {
          high: "硬质张力",
          medium: "克制力量",
          varied: "粗粝变奏",
        },
        intimacy_warmth: {
          high: "亲密留白",
          medium: "柔暖边界",
          varied: "温度回响",
        },
      }
    : {
        melancholy_isolation: {
          high: "Cold Interior",
          medium: "Suspended Distance",
          varied: "Drifting Solitude",
        },
        mystery_unknown: {
          high: "Veiled Tension",
          medium: "Unresolved Atmosphere",
          varied: "Mutable Enigma",
        },
        power_grit: {
          high: "Hard Tension",
          medium: "Restrained Force",
          varied: "Grit Variations",
        },
        intimacy_warmth: {
          high: "Intimate Reserve",
          medium: "Soft Edge",
          varied: "Warm Echo",
        },
      };

  return labels[dominant]?.[coherence] || (locale === "zh" ? "系列基调" : "Series Direction");
}

function buildSeriesNarrativeText(dominant, coherence, locale) {
  const firstSentence = locale === "zh"
    ? {
        melancholy_isolation:
          "整组画面把情绪压在冷部与留白之间，人物像被空气轻轻隔开，叙事靠克制而不是解释推进。",
        mystery_unknown:
          "整组画面把信息留在半明半暗处，主体并不急着被看清，叙事因此保持悬停与延迟。",
        power_grit:
          "整组画面依靠硬朗光比与边缘张力向前推进，人物不是被柔化，而是在阻力里显出轮廓。",
        intimacy_warmth:
          "整组画面把温度压在很近的距离里，光线停在皮肤与空气之间，让关系感保持克制的靠近。",
      }
    : {
        melancholy_isolation:
          "The series keeps its emotion suspended between cool passages and negative space, letting the subject feel held at a slight distance while restraint does the narrative work.",
        mystery_unknown:
          "The series leaves key information inside half-light, so the subject is never hurried into clarity and the narrative keeps its delay intact.",
        power_grit:
          "The series moves through hard contrast and edge tension, refusing to soften the subject and letting form emerge through resistance.",
        intimacy_warmth:
          "The series keeps its warmth at close range, with light resting between skin and air so intimacy arrives with discipline rather than display.",
      };

  const secondSentence = locale === "zh"
    ? {
        high:
          "各帧成熟度波动很小，风格像同一段呼吸反复出现，因此系列感完整而稳定。",
        medium:
          "成熟度分布保持在同一轨道，但仍留出少量转折，让系列不是重复，而是有层次地延伸。",
        varied:
          "成熟度起伏更明显，风格不是单线展开，而像同一情绪在不同章节里换了说法。",
      }
    : {
        high:
          "Maturity shifts very little from frame to frame, so the style returns like the same breath and the series feels fully resolved.",
        medium:
          "The maturity spread stays on one track but leaves room for small turns, so the sequence extends itself instead of merely repeating.",
        varied:
          "The maturity curve moves more visibly, so the style behaves less like a single line and more like one emotion rewritten across chapters.",
      };

  return `${firstSentence[dominant]} ${secondSentence[coherence]}`;
}

function buildSeriesTitlesText(dominant, coherence, locale) {
  const coherencePhrase = locale === "zh"
    ? {
        high: "同一口气",
        medium: "缓慢转场",
        varied: "不同章节",
      }
    : {
        high: "one pulse",
        medium: "a slow drift",
        varied: "different chapters",
      };

  if (locale === "zh") {
    const titles = {
      melancholy_isolation: [
        `冷部缓慢收拢，故事停在${coherencePhrase[coherence]}里`,
        "把沉默分成几帧去说完",
        "疏离感没有放大，只被安静保留",
      ],
      mystery_unknown: [
        `不是看清，而是让未知留在${coherencePhrase[coherence]}里`,
        "每一帧都像一句没说完的话",
        "神秘感被压低，却更难忘记",
      ],
      power_grit: [
        `情绪不必喊出来，力量会在${coherencePhrase[coherence]}里显形`,
        "硬光、阴影与人物一起向前",
        "把粗粝感留在结构里，而不是表面里",
      ],
      intimacy_warmth: [
        `光线停在将近触碰的地方，也停在${coherencePhrase[coherence]}里`,
        "亲密感没有外放，只轻轻靠近",
        "把温度留给空气，而不是台词",
      ],
    };

    return titles[dominant] || [];
  }

  const titles = {
    melancholy_isolation: [
      `Cool restraint held inside ${coherencePhrase[coherence]}`,
      "Let silence carry the sequence",
      "Distance kept, emotion retained",
    ],
    mystery_unknown: [
      `Leave the unknown inside ${coherencePhrase[coherence]}`,
      "Every frame keeps one sentence unfinished",
      "Mystery lowered into memory",
    ],
    power_grit: [
      `Force takes shape through ${coherencePhrase[coherence]}`,
      "Hard light, shadow, and subject moving together",
      "Keep the grit in the structure",
    ],
    intimacy_warmth: [
      `Warmth held just short of touch, inside ${coherencePhrase[coherence]}`,
      "Let intimacy move quietly closer",
      "Leave the temperature in the air",
    ],
  };

  return titles[dominant] || [];
}

function buildSeriesCaptionText(dominant, coherence, locale) {
  const openings = locale === "zh"
    ? {
        melancholy_isolation:
          "这组图没有急着解释人物，它先让冷部、阴影与留白维持住距离。",
        mystery_unknown:
          "这组图没有把信息一次性交代清楚，而是把重点留在半明半暗之间。",
        power_grit:
          "这组图的力量来自结构而不是姿态，光比、边缘和人物一起把情绪往前推。",
        intimacy_warmth:
          "这组图把温度压在很近的位置里，光线只轻轻碰到皮肤，却没有越界。",
      }
    : {
        melancholy_isolation:
          "This series does not hurry to explain the subject; it lets cool shadow and negative space keep their distance first.",
        mystery_unknown:
          "This series does not deliver its information all at once; it keeps the important parts suspended inside half-light.",
        power_grit:
          "The force in this series comes from structure rather than pose, with contrast, edges, and the subject pushing in the same direction.",
        intimacy_warmth:
          "This series keeps its warmth very close, letting light brush the skin without crossing into performance.",
      };

  const closings = locale === "zh"
    ? {
        high:
          "各帧之间几乎没有失焦，因此系列感很完整，情绪会在滑过之后继续停留。",
        medium:
          "它保持同一条情绪主线，但每一帧都留出一点偏移，所以系列读起来更像延伸而不是重复。",
        varied:
          "它允许情绪在不同章节里变换说法，于是风格不是被打散，而是被拉成更长的叙事。",
      }
    : {
        high:
          "Very little slips out of focus between frames, so the series feels complete and the emotion keeps lingering after the scroll.",
        medium:
          "It stays on one emotional line while allowing small deviations, so the sequence reads as an extension rather than a repeat.",
        varied:
          "It lets the emotion change its wording across chapters, so the style widens into narrative instead of breaking apart.",
      };

  return `${openings[dominant]} ${closings[coherence]}`;
}

export async function analyzeAestheticImage(file, locale = "en") {
  if (!(file instanceof File)) {
    throw new Error("invalid-file");
  }

  const image = await loadImage(file);
  const sample = sampleImage(image);
  const stats = buildStats(sample);
  return buildDashboard(stats, locale);
}

export function buildSeriesNarrative(seriesResults, locale = "en") {
  const validResults = (seriesResults || []).filter(Boolean);
  const empty = {
    dominant_direction: locale === "zh" ? "系列方向未定" : "Series Direction Pending",
    avg_maturity_score: 0,
    series_narrative: "",
    series_titles: [],
    series_caption: "",
  };

  if (!validResults.length) {
    return empty;
  }

  const dimensions = [
    "melancholy_isolation",
    "mystery_unknown",
    "power_grit",
    "intimacy_warmth",
  ];
  const averages = dimensions.reduce((accumulator, key) => {
    accumulator[key] = Math.round(
      validResults.reduce((sum, result) => {
        const resonance = result?.aesthetic_dashboard?.emotional_resonance || {};
        return sum + (resonance[key] || 0);
      }, 0) / validResults.length,
    );
    return accumulator;
  }, {});

  const dominant = dimensions.reduce(
    (current, key) => (averages[key] > averages[current] ? key : current),
    dimensions[0],
  );
  const avgScore = calcMaturityFromResonance(averages);
  const maturityScores = validResults.map((result) =>
    calcMaturityFromResonance(result?.aesthetic_dashboard?.emotional_resonance || {}),
  );
  const mean =
    maturityScores.reduce((sum, score) => sum + score, 0) / maturityScores.length;
  const variance =
    maturityScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
    maturityScores.length;
  const std = Math.sqrt(variance);
  const coherence = getSeriesCoherenceBand(std);

  return {
    dominant_direction: getSeriesDirectionLabel(dominant, coherence, locale),
    avg_maturity_score: avgScore,
    series_narrative: buildSeriesNarrativeText(dominant, coherence, locale),
    series_titles: buildSeriesTitlesText(dominant, coherence, locale),
    series_caption: buildSeriesCaptionText(dominant, coherence, locale),
  };
}
