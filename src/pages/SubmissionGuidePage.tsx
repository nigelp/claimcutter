import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { format } from 'date-fns';
import {
  Globe,
  FileText,
  CheckCircle,
  ExternalLink,
  Copy,
  Clock,
  Mail,
  MapPin,
  AlertCircle,
  Download,
  Printer,
  ChevronRight,
  Calendar,
  ArrowRight,
  Eye,
} from 'lucide-react';

async function generateN1Pdf(claim: NonNullable<ReturnType<typeof useAppStore.getState>['claims']>[number]) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595.28, 841.89]);
  let y = 800;

  const drawText = (text: string, size: number, opts: { bold?: boolean; indent?: number } = {}) => {
    const f = opts.bold ? boldFont : font;
    page.drawText(text, { x: 50 + (opts.indent || 0), y, size, font: f, color: rgb(0, 0, 0) });
    y -= size + 6;
  };

  const drawLine = () => {
    page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
    y -= 8;
  };

  drawText('N1 Claim Form', 22, { bold: true });
  drawText('County Court', 12);
  y -= 6;
  drawLine();
  y -= 8;

  drawText('Claimant Details', 14, { bold: true });
  y -= 4;
  drawText(`Name: ${claim.claimant.fullName}`, 11);
  drawText(`Address: ${claim.claimant.address.line1}`, 11);
  drawText(`${claim.claimant.address.city}, ${claim.claimant.address.postcode}`, 11, { indent: 46 });
  if (claim.claimant.phone) drawText(`Phone: ${claim.claimant.phone}`, 11);
  if (claim.claimant.email) drawText(`Email: ${claim.claimant.email}`, 11);
  y -= 6;

  drawText('Defendant Details', 14, { bold: true });
  y -= 4;
  drawText(`Name: ${claim.defendant.fullName}`, 11);
  drawText(`Address: ${claim.defendant.address.line1}`, 11);
  drawText(`${claim.defendant.address.city}, ${claim.defendant.address.postcode}`, 11, { indent: 46 });
  y -= 6;

  const totalClaim = (claim.claimAmount || 0) + (claim.interest?.calculatedAmount || 0);
  drawText('Claim Amount', 14, { bold: true });
  y -= 4;
  drawText(`Total: £${totalClaim.toFixed(2)}`, 11, { bold: true });
  y -= 6;

  if (claim.particularsOfClaim) {
    drawText('Particulars of Claim', 14, { bold: true });
    y -= 4;
    const words = claim.particularsOfClaim.split(' ');
    let line = '';
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(testLine, 11) > 495) {
        drawText(line, 11);
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) drawText(line, 11);
  }

  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'N1_claim_form.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function SubmissionGuidePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'online' | 'paper'>('online');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [coverLetterCopySuccess, setCoverLetterCopySuccess] = useState(false);
  const n1PreviewRef = useRef<HTMLDivElement>(null);
  const { claims, currentClaimId, saveCurrentClaim } = useAppStore();
  const claim = claims.find((c) => c.id === currentClaimId) || claims[0];

  const totalClaim = (claim?.claimAmount || 0) + (claim?.interest?.calculatedAmount || 0);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmitClaim = async () => {
    if (claim) {
      const updatedClaim = {
        ...claim,
        status: 'claim_submitted' as const,
        submissionDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveCurrentClaim(updatedClaim);
      window.open('https://www.gov.uk/make-court-claim-for-money/make-claim', '_blank', 'noopener,noreferrer');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (claim) {
      await generateN1Pdf(claim);
      if (claim.status !== 'claim_submitted') {
        const updatedClaim = {
          ...claim,
          status: 'claim_submitted' as const,
          submissionDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveCurrentClaim(updatedClaim);
      }
    }
  };

  const generateCoverLetter = (claimData: typeof claim) => {
    if (!claimData) return '';
    const today = format(new Date(), 'd MMMM yyyy');
    const claimantAddr = [
      claimData.claimant.address.line1,
      claimData.claimant.address.line2,
      claimData.claimant.address.city,
      claimData.claimant.address.county,
      claimData.claimant.address.postcode,
    ].filter(Boolean).join('\n');

    return `County Court Money Claims Centre
PO Box 527
M5 0BY

${today}

Dear Sir/Madam,

RE: Claim against ${claimData.defendant.fullName}

Please find enclosed my N1 Claim Form and supporting documents for the above matter.

CLAIM DETAILS:
- Claimant: ${claimData.claimant.fullName}
- Defendant: ${claimData.defendant.fullName}
- Claim Amount: £${(claimData.claimAmount || 0).toFixed(2)}
${claimData.interest?.calculatedAmount ? `- Interest: £${claimData.interest.calculatedAmount.toFixed(2)}\n` : ''}- Total Claim: £${totalClaim.toFixed(2)}
${claimData.courtFee ? `- Court Fee: £${claimData.courtFee.toFixed(2)}\n` : ''}
${claimData.particularsOfClaim ? `\nPARTICULARS OF CLAIM:\n${claimData.particularsOfClaim}\n` : ''}
ENCLOSED DOCUMENTS:
1. N1 Claim Form (2 copies)
2. Particulars of Claim
3. Court fee payment / EX160 form
4. Copies for defendant

Please acknowledge receipt of this claim and confirm the claim number.

Yours faithfully,


${claimData.claimant.fullName}
${claimantAddr}
`;
  };

  const handlePrintCoverLetter = () => {
    if (!claim) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Cover Letter</title>
          <style>body { font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.6; white-space: pre-wrap; }</style>
          </head>
          <body>${generateCoverLetter(claim).replace(/\n/g, '<br>')}</body>
          <script>window.onload = function() { window.print(); }</script>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownloadCoverLetter = () => {
    if (!claim) return;
    const blob = new Blob([generateCoverLetter(claim)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cover_Letter_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCoverLetter = async () => {
    if (!claim) return;
    try {
      await navigator.clipboard.writeText(generateCoverLetter(claim));
      setCoverLetterCopySuccess(true);
      setTimeout(() => setCoverLetterCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const onlineSteps = [
    {
      title: 'Register for MCOL',
      description: 'Create an account on the Money Claim Online service',
      link: 'https://www.gov.uk/make-court-claim-for-money',
      linkText: 'Register on GOV.UK',
    },
    {
      title: 'Enter Claimant Details',
      description: 'Use the pre-filled data below',
    },
    {
      title: 'Enter Defendant Details',
      description: 'Use the pre-filled data below',
    },
    {
      title: 'Enter Claim Amount',
      description: `Total: £${totalClaim.toFixed(2)}`,
    },
    {
      title: 'Enter Particulars of Claim',
      description: 'Copy from the pre-filled section below',
    },
    {
      title: 'Pay Court Fee',
      description: 'Fee will be calculated based on claim amount',
    },
    {
      title: 'Submit Claim',
      description: 'Review all details and submit your claim via MCOL',
      link: 'https://www.gov.uk/make-court-claim-for-money/make-claim',
      linkText: 'Submit claim',
      linkClick: handleSubmitClaim,
    },
  ];

  const onlineChecklist = [
    'MCOL account registered',
    'Claimant details ready',
    'Defendant details ready',
    'Claim amount calculated',
    'Particulars of claim written',
    'Court fee payment method ready',
  ];

  const paperChecklist = [
    { text: 'N1 form completed', links: null },
    { text: 'Particulars of claim attached', links: null },
    {
      text: 'Court fee paid or EX160 form included',
      links: [
        { url: 'https://www.gov.uk/government/publications/apply-for-help-with-court-and-tribunal-fees', label: 'EX160 PDF' },
        { url: 'https://www.gov.uk/get-help-with-court-fees', label: 'Apply online' },
      ],
    },
    { text: 'Copies for each defendant', links: null },
    { text: 'Covering letter (optional)', links: null },
  ];

  const timelineEvents = [
    {
      day: 'Day 1',
      title: 'Claim Submitted',
      description: 'Court issues claim form to defendant',
      icon: Mail,
    },
    {
      day: 'Day 5-7',
      title: 'Defendant Receives Claim',
      description: 'Defendant has 14 days to respond',
      icon: Clock,
    },
    {
      day: 'Day 19',
      title: 'Response Deadline',
      description: 'Defendant must file acknowledgment or defence',
      icon: Calendar,
    },
    {
      day: 'Day 33',
      title: 'Full Defence Due',
      description: 'Full defence must be filed if acknowledged',
      icon: Calendar,
    },
    {
      day: 'After Response',
      title: 'Next Steps',
      description: 'Mediation, hearing, or judgment',
      icon: ChevronRight,
    },
  ];

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #n1-preview, #n1-preview * {
            visibility: visible;
          }
          #n1-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Submission Guide</h1>
            <p className="text-gray-600 dark:text-gray-400">Submit your claim online or by post</p>
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('online')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'online'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <Globe className="w-5 h-5" />
            Online (MCOL)
          </button>
          <button
            onClick={() => setActiveTab('paper')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'paper'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <FileText className="w-5 h-5" />
            Paper Submission
          </button>
        </div>

        {activeTab === 'online' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Step-by-Step Guide
              </h2>
              <div className="space-y-4">
                {onlineSteps.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{step.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                      {step.link && (
                        step.linkClick ? (
                          <button
                            onClick={step.linkClick}
                            className="inline-flex items-center gap-1 mt-1 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {step.linkText}
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        ) : (
                          <a
                            href={step.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {step.linkText}
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {claim && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Copy className="w-5 h-5" />
                  Pre-filled Data (Click to Copy)
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Claimant Name
                    </label>
                    <div
                      onClick={() => copyToClipboard(claim.claimant.fullName, 'claimantName')}
                      className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-between items-center"
                    >
                      <span className="text-gray-900 dark:text-white">{claim.claimant.fullName}</span>
                      {copiedField === 'claimantName' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Claimant Address
                    </label>
                    <div
                      onClick={() =>
                        copyToClipboard(
                          `${claim.claimant.address.line1}, ${claim.claimant.address.city}, ${claim.claimant.address.postcode}`,
                          'claimantAddress'
                        )
                      }
                      className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-between items-center"
                    >
                      <span className="text-gray-900 dark:text-white">
                        {claim.claimant.address.line1}, {claim.claimant.address.city},{' '}
                        {claim.claimant.address.postcode}
                      </span>
                      {copiedField === 'claimantAddress' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Defendant Name
                    </label>
                    <div
                      onClick={() => copyToClipboard(claim.defendant.fullName, 'defendantName')}
                      className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-between items-center"
                    >
                      <span className="text-gray-900 dark:text-white">{claim.defendant.fullName}</span>
                      {copiedField === 'defendantName' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Claim Amount
                    </label>
                    <div
                      onClick={() => copyToClipboard(totalClaim.toFixed(2), 'claimAmount')}
                      className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-between items-center"
                    >
                      <span className="text-gray-900 dark:text-white">£{totalClaim.toFixed(2)}</span>
                      {copiedField === 'claimAmount' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  {claim.particularsOfClaim && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Particulars of Claim
                      </label>
                      <div
                        onClick={() =>
                          copyToClipboard(claim.particularsOfClaim, 'particulars')
                        }
                        className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-between items-start"
                      >
                        <span className="text-gray-900 dark:text-white text-sm whitespace-pre-wrap">
                          {claim.particularsOfClaim}
                        </span>
                        {copiedField === 'particulars' ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 ml-2" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Checklist - What You Need
              </h2>
              <div className="space-y-2">
                {onlineChecklist.map((item, index) => (
                  <label key={index} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'paper' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Postal Address
              </h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    County Court Money Claims Centre
                  </p>
                  <p className="text-blue-800 dark:text-blue-200">PO Box 527</p>
                  <p className="text-blue-800 dark:text-blue-200">M5 0BY</p>
                </div>
              </div>
            </div>

            {claim && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    N1 Form Preview
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <a
                    href="https://www.gov.uk/government/publications/form-n1-claim-form-cpr-part-7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Download className="w-4 h-4" />
                    <span className="font-medium">Download official N1 Claim Form from GOV.UK</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div id="n1-preview" ref={n1PreviewRef} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4 bg-white mt-4">
                  <div className="text-center border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-bold text-gray-900">N1 Claim Form</h3>
                    <p className="text-sm text-gray-500">County Court</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Claimant</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                        <p className="font-medium">{claim.claimant.fullName}</p>
                        <p className="text-gray-600">{claim.claimant.address.line1}</p>
                        <p className="text-gray-600">{claim.claimant.address.city}</p>
                        <p className="text-gray-600">{claim.claimant.address.postcode}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Defendant</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                        <p className="font-medium">{claim.defendant.fullName}</p>
                        <p className="text-gray-600">{claim.defendant.address.line1}</p>
                        <p className="text-gray-600">{claim.defendant.address.city}</p>
                        <p className="text-gray-600">{claim.defendant.address.postcode}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Claim Amount</label>
                    <div className="mt-1 p-2 bg-gray-50 rounded text-lg font-bold">
                      £{totalClaim.toFixed(2)}
                    </div>
                  </div>
                  {claim.particularsOfClaim && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Particulars of Claim
                      </label>
                      <div className="mt-1 p-2 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                        {claim.particularsOfClaim}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Checklist - What to Include
              </h2>
              <div className="space-y-2">
                {paperChecklist.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1" />
                    <div className="flex-1">
                      <span className="text-gray-700 dark:text-gray-300">{item.text}</span>
                      {item.links && (
                        <div className="flex gap-3 mt-1">
                          {item.links.map((link, i) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {link.label}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {claim && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Cover Letter
                  </h2>
                  <button
                    onClick={() => setShowCoverLetter(!showCoverLetter)}
                    className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Eye className="w-4 h-4" />
                    {showCoverLetter ? 'Hide' : 'Show'} Full Letter
                  </button>
                </div>

                {showCoverLetter && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">
                      {generateCoverLetter(claim)}
                    </pre>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 mb-6">
                  <button
                    onClick={handlePrintCoverLetter}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={handleDownloadCoverLetter}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Letter
                  </button>
                  <button
                    onClick={handleCopyCoverLetter}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    {coverLetterCopySuccess ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Important Notes
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-200">
                  <li>Send 2 copies of the N1 form (one for court, one for defendant)</li>
                  <li>Include a cheque or postal order for the court fee</li>
                  <li>Keep a copy for your records</li>
                  <li>Use recorded delivery for proof of posting</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Timeline After Submission
          </h2>
          <div className="space-y-4">
            {timelineEvents.map((event, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <event.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  {index < timelineEvents.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2" />
                  )}
                </div>
                <div className="pb-4">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {event.day}
                  </span>
                  <h3 className="font-medium text-gray-900 dark:text-white">{event.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={() => navigate('/tracker')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go to Claim Tracker
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}