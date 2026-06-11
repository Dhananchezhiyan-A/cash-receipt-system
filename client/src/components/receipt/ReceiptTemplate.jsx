import logo from '../../assets/logo.png';
import { numberToWords } from "../../utils/numberToWords";

export default function ReceiptTemplate({ type, data }) {
  const isIn = type === 'in';
  return (
    <div id="receipt-print-area" className="bg-white text-slate-900 p-10 w-[210mm] min-h-[148mm] mx-auto border border-slate-300">
      <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
        <img src={logo} alt="DreamCode Technology" className="h-14" />
        <div className="text-right">
          <div className="text-xl font-bold tracking-wide">{isIn ? 'CASH RECEIPT' : 'PAYMENT VOUCHER'}</div>
          <div className="text-xs text-slate-500 mt-1">
            {isIn ? 'Receipt No: ' : 'Voucher No: '}<span className="font-semibold text-slate-800">{data.number || '—'}</span>
          </div>
          <div className="text-xs text-slate-500">Date: <span className="font-semibold text-slate-800">{data.date ? new Date(`${data.date}T00:00:00`).toLocaleDateString() : '—'}</span></div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <Field label={isIn ? 'Received From' : 'Paid To'} value={data.party} />
        <Field label="Payment Mode" value={data.paymentMode} />
        <Field label="Purpose" value={data.purpose} full />
      </div>

      <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-slate-600">Amount</div>
          <div className="text-2xl font-bold text-slate-900">₹{(parseFloat(data.amount) || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</div>
        </div>
       <div className="mt-2 text-sm text-slate-700">
  <span className="font-semibold">In Words:</span>{" "}
  {data.amountInWords || numberToWords(data.amount)}
</div>
      </div>

      <div className="mt-12 flex justify-between text-sm">
        <div>
          <div className="border-t border-slate-400 pt-1 w-48 text-center text-slate-600">Receiver Signature</div>
        </div>
        <div>
          <div className="font-semibold">{isIn ? 'Received By' : 'Approved By'}: {data.signedBy}</div>
          <div className="border-t border-slate-400 pt-1 w-48 text-center text-slate-600 mt-8">Authorized Signatory</div>
        </div>
      </div>

      <div className="mt-10 text-center text-xs text-slate-400 border-t pt-3">
        Computer generated {isIn ? 'receipt' : 'voucher'} · Generated on {new Date().toLocaleString()}
        <br />DreamCode Technology · Cash Receipt Management System
      </div>
    </div>
  );
}

function Field({ label, value, full }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <div className="text-xs uppercase text-slate-500 font-medium">{label}</div>
      <div className="mt-1 font-medium text-slate-800">{value || '—'}</div>
    </div>
  );
}
