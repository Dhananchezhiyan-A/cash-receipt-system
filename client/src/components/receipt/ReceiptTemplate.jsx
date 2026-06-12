import logo from '../../assets/logo.png';
import watermarkLogo from '../../assets/logo.jpeg';
import { numberToWords } from '../../utils/numberToWords';

export default function ReceiptTemplate({ type, data }) {
  const isIn = type === 'in';

  return (
    <div
      id="receipt-print-area"
      className="relative isolate overflow-hidden bg-white text-slate-900 p-4 sm:p-8 lg:p-10 w-[210mm] min-h-[148mm] mx-auto border border-slate-300"
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
        <img src={watermarkLogo} alt="" className="max-w-[70%] max-h-[70%] object-contain opacity-[0.07]" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b-2 border-slate-800 pb-4">
          <img src={logo} alt="DreamCode Technology" className="h-12 sm:h-14 object-contain self-start" />
          <div className="sm:text-right">
            <div className="text-lg sm:text-xl font-bold tracking-wide">{isIn ? 'CASH RECEIPT' : 'PAYMENT VOUCHER'}</div>
            <div className="text-xs text-slate-500 mt-1">
              {isIn ? 'Receipt No: ' : 'Voucher No: '}
              <span className="font-semibold text-slate-800">{data.number || '-'}</span>
            </div>
            <div className="text-xs text-slate-500">
              Date:{' '}
              <span className="font-semibold text-slate-800">
                {data.date ? new Date(`${data.date}T00:00:00`).toLocaleDateString() : '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <Field label={isIn ? 'Received From' : 'Paid To'} value={data.party} />
          <Field label="Payment Mode" value={data.paymentMode} />
          <Field label="Purpose" value={data.purpose} full />
        </div>

        <div className="mt-5 sm:mt-6 bg-slate-50/90 border border-slate-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
            <div className="text-sm text-slate-600">Amount</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 break-words">
              Rs. {(parseFloat(data.amount) || 0).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="mt-2 text-sm text-slate-700 break-words">
            <span className="font-semibold">In Words:</span>{' '}
            {data.amountInWords || numberToWords(data.amount)}
          </div>
        </div>

        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row justify-between gap-10 text-sm">
          <div>
            <div className="border-t border-slate-400 pt-1 w-48 max-w-full text-center text-slate-600">Receiver Signature</div>
          </div>
          <div className="sm:text-right">
            <div className="font-semibold break-words">{isIn ? 'Received By' : 'Approved By'}: {data.signedBy}</div>
            <div className="border-t border-slate-400 pt-1 w-48 max-w-full text-center text-slate-600 mt-8 sm:ml-auto">Authorized Signatory</div>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 text-center text-xs text-slate-400 border-t pt-3">
          Computer generated {isIn ? 'receipt' : 'voucher'} | Generated on {new Date().toLocaleString()}
          <br />DreamCode Technology | Cash Receipt Management System
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, full }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <div className="text-xs uppercase text-slate-500 font-medium">{label}</div>
      <div className="mt-1 font-medium text-slate-800 break-words">{value || '-'}</div>
    </div>
  );
}
