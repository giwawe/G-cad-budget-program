"use client";

import { ArrowLeft, BookOpen, Download, FileText, Presentation } from "lucide-react";
import {
  buildDrawingSpecGuideWordHtml,
  drawingSpecGuideFileName,
  drawingSpecGuideSections,
} from "@/lib/drawing-spec-guide";
import {
  buildSpaceNamingGuideWordHtml,
  type GuideSection,
  spaceNamingGuideFileName,
  spaceNamingGuideSections,
} from "@/lib/space-naming-guide";

const DESIGNER_TRAINING_PPT_URL = "/training/designer-training-v1.1.pptx";
const DESIGNER_TRAINING_PPT_FILE_NAME = "整装预算报价系统设计师培训-v1.1.pptx";
const WORD_MIME_TYPE = "application/msword;charset=utf-8";

const trainingSlides = [
  "培训目标：会画规范方案、会复核平台结果、会导出预算",
  "系统流程：规范画图、方案上传、完整性复核、可选项确认、预算预览",
  "画图规范：核心图层、空间边界、门窗洞口、楼层命名",
  "平台操作：上传 DXF/DWG、确认方案信息、水电点位和空间摘要",
  "预算导出：先进入预算预览，发现问题可返回修改，再下载预算表",
  "常见问题：建筑面积为 0、空间命名需拆分、DWG 转换失败等排查",
];

function inlineGuideParts(text: string): (string | { code: string })[] {
  return text.split(/(`[^`]+`)/g).filter(Boolean).map((part) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return { code: part.slice(1, -1) };
    }
    return part;
  });
}

function InlineGuideText({ text }: { text: string }) {
  return (
    <>
      {inlineGuideParts(text).map((part, index) =>
        typeof part === "string" ? (
          <span key={`${part}-${index}`}>{part}</span>
        ) : (
          <code key={`${part.code}-${index}`}>{part.code}</code>
        ),
      )}
    </>
  );
}

function downloadWordDocument(fileName: string, content: string) {
  const blob = new Blob([content], { type: WORD_MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function GuidePreview({ sections }: { sections: GuideSection[] }) {
  return (
    <div className="trainingGuidePreview">
      {sections.map((section) => (
        <section className="trainingGuideSection" key={section.title}>
          <h3>{section.title}</h3>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph}>
              <InlineGuideText text={paragraph} />
            </p>
          ))}
          {section.bullets && (
            <ul>
              {section.bullets.map((bullet) => (
                <li key={bullet}>
                  <InlineGuideText text={bullet} />
                </li>
              ))}
            </ul>
          )}
          {section.table && (
            <div className="trainingTableWrap">
              <table>
                <thead>
                  <tr>
                    {section.table.headers.map((header) => (
                      <th key={header}>
                        <InlineGuideText text={header} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.table.rows.map((row, rowIndex) => (
                    <tr key={`${section.title}-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${section.title}-${rowIndex}-${cellIndex}`}>
                          <InlineGuideText text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

export default function TrainingResourcesPage() {
  return (
    <main className="trainingPage">
      <section className="trainingHero">
        <div>
          <a className="trainingBackLink" href="/">
            <ArrowLeft aria-hidden="true" size={16} />
            返回预算工作台
          </a>
          <p>设计师培训资料中心</p>
          <h1>先浏览，再下载</h1>
          <span>规范资料和培训课件集中放在这里，适合新人自学、门店培训和投屏讲解。</span>
        </div>
        <div className="trainingHeroCard" aria-label="资料类型">
          <strong>3 份资料</strong>
          <span>培训 PPT / 空间命名规范 / CAD 画图规范</span>
        </div>
      </section>

      <nav className="trainingResourceNav" aria-label="培训资料导航">
        <a href="#training-ppt">
          <Presentation aria-hidden="true" size={18} />
          培训PPT
        </a>
        <a href="#space-naming">
          <BookOpen aria-hidden="true" size={18} />
          空间命名规范
        </a>
        <a href="#drawing-spec">
          <FileText aria-hidden="true" size={18} />
          画图规范
        </a>
      </nav>

      <section className="trainingResourceBlock" id="training-ppt">
        <div className="trainingResourceHeader">
          <div>
            <p>推荐先看</p>
            <h2>整装预算报价系统设计师培训 PPT</h2>
            <span>图文版课件，覆盖规范画图、平台上传复核、预算导出和常见问题排查。</span>
          </div>
          <a className="trainingDownloadButton" href={DESIGNER_TRAINING_PPT_URL} download={DESIGNER_TRAINING_PPT_FILE_NAME}>
            <Download aria-hidden="true" size={18} />
            下载 PPT
          </a>
        </div>
        <div className="trainingSlidePreview">
          {trainingSlides.map((slide, index) => (
            <article key={slide}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{slide}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="trainingResourceBlock" id="space-naming">
        <div className="trainingResourceHeader">
          <div>
            <p>空间命名</p>
            <h2>CAD 空间命名规范</h2>
            <span>浏览空间命名、楼层前缀、空间拆分和常见错误；下载后可用 Word 打开。</span>
          </div>
          <button
            className="trainingDownloadButton"
            type="button"
            onClick={() => downloadWordDocument(spaceNamingGuideFileName("样例数据"), buildSpaceNamingGuideWordHtml())}
          >
            <Download aria-hidden="true" size={18} />
            下载 Word
          </button>
        </div>
        <GuidePreview sections={spaceNamingGuideSections} />
      </section>

      <section className="trainingResourceBlock" id="drawing-spec">
        <div className="trainingResourceHeader">
          <div>
            <p>画图规范</p>
            <h2>CAD 画图规范</h2>
            <span>浏览必画图层、按需图层、空间边界和上传后复核顺序；下载后可用 Word 打开。</span>
          </div>
          <button
            className="trainingDownloadButton"
            type="button"
            onClick={() => downloadWordDocument(drawingSpecGuideFileName("样例数据"), buildDrawingSpecGuideWordHtml())}
          >
            <Download aria-hidden="true" size={18} />
            下载 Word
          </button>
        </div>
        <GuidePreview sections={drawingSpecGuideSections} />
      </section>
    </main>
  );
}
