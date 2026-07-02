import logo from '../../assets/logo.png';
import watermarkLogo from '../../assets/logo.jpeg';
import { numberToWords } from '../../utils/numberToWords';

export default function ReceiptTemplate({ type, data }) {
  const isIn = type === 'in';

  return (
    <div
      id="receipt-print-area"
      className="relative isolate overflow-hidden bg-white text-slate-900 w-[210mm] min-h-[297mm] mx-auto"
      style={{ padding: '15mm 20mm' }}
    >
      {/* Watermark */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
        <img src={watermarkLogo} alt="" className="w-64 h-64 object-contain opacity-[0.07]" />
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-6 border-b-2 border-slate-800 pb-4">
          <div className="flex-shrink-0">
            <img src={logo} alt="DreamCode Technology" className="h-14 w-auto object-contain" />
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold tracking-wide text-slate-900">{isIn ? 'CASH RECEIPT' : 'PAYMENT VOUCHER'}</div>
            <div className="text-sm text-slate-600 mt-2 leading-relaxed">
              <div>
                {isIn ? 'Receipt No: ' : 'Voucher No: '}
                <span className="font-semibold text-slate-800">{data.number || '-'}</span>
              </div>
              <div>
                Date:{' '}
                <span className="font-semibold text-slate-800">
                  {data.date ? new Date(`${data.date}T00:00:00`).toLocaleDateString('en-IN', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  }) : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="mt-6 grid grid-cols-2 gap-x-12 gap-y-5 text-sm">
          <Field label={isIn ? 'Received From' : 'Paid To'} value={data.party} />
          <Field label="Payment Mode" value={data.paymentMode} />
          <Field label="Purpose" value={data.purpose} full />
        </div>

        {/* Amount Section */}
        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="text-base font-medium text-slate-700">Amount</div>
            <div className="text-3xl font-bold text-slate-900 text-right">
              Rs. {(parseFloat(data.amount) || 0).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 text-base text-slate-700 leading-relaxed">
            <span className="font-semibold">In Words:</span>{' '}
            {data.amountInWords || numberToWords(data.amount)}
          </div>
        </div>

        {/* Signature Section */}
        <div className="mt-12 flex justify-between items-end gap-8 text-sm">
          <div className="flex-1">
            <div className="border-t-2 border-slate-600 pt-2 text-center text-slate-700 font-medium h-16">
              Receiver Signature
            </div>
          </div>
          <div className="flex-1 text-right">
            <div className="font-semibold text-slate-800 mb-8 break-words">
              {isIn ? 'Received By' : 'Approved By'}: {data.signedBy || ''}
            </div>
            <div className="border-t-2 border-slate-600 pt-2 text-center text-slate-700 font-medium h-16">
              Authorized Signatory
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-3 border-t border-slate-300 text-center text-xs text-slate-500 leading-relaxed">
          <div>Computer generated {isIn ? 'receipt' : 'voucher'} | Generated on {new Date().toLocaleString('en-IN')}</div>
          <div className="mt-1">DreamCode Technology | Cash Receipt Management System</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, full }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <div className="text-sm uppercase text-slate-500 font-medium tracking-wide">{label}</div>
      <div className="mt-1 text-base font-medium text-slate-800 break-words">{value || '-'}</div>
    </div>
  );
}