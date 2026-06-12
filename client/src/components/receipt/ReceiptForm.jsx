import { forwardRef, useEffect, useMemo, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Printer, Download, Save, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import { numberToWords } from '../../utils/numberToWords';
import { downloadElementAsPDF } from '../../utils/pdf';
import ReceiptTemplate from './ReceiptTemplate';

const MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'NEFT', 'RTGS', 'IMPS', 'Card', 'Other'];
const MAX_AMOUNT = 999999999.99;

const getDefaultValues = () => ({
  number: '',
  date: new Date().toISOString().slice(0, 10),
  party: '',
  purpose: '',
  paymentMode: 'Cash',
  amount: '',
  amountInWords: 'Zero Rupees Only',
  signedBy: '',
});

export default function ReceiptForm({ type }) {
  const isIn = type === 'in';
  const previewRef = useRef(null);
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: getDefaultValues(), mode: 'onTouched' });

  const values = useWatch({ control });
  const numericAmount = Number(values.amount);
  const liveData = useMemo(() => ({
    number: values.number?.trim() || '',
    date: values.date || '',
    party: values.party?.trim() || '',
    purpose: values.purpose?.trim() || '',
    paymentMode: values.paymentMode || 'Cash',
    amount: Number.isFinite(numericAmount) ? numericAmount : 0,
    amountInWords: values.amountInWords || 'Zero Rupees Only',
    signedBy: values.signedBy?.trim() || '',
  }), [values, numericAmount]);

  useEffect(() => {
    setValue('amountInWords', numberToWords(numericAmount), {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [numericAmount, setValue]);

  const handleReset = () => reset(getDefaultValues());

  const onSubmit = async (formValues) => {
    const amount = Number(formValues.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
      toast.error(`Enter an amount between 0.01 and ${MAX_AMOUNT}`);
      return;
    }
    const common = {
      date: formValues.date,
      purpose: formValues.purpose.trim(),
      paymentMode: formValues.paymentMode,
      amount,
      amountInWords: numberToWords(amount),
    };
    const payload = isIn
      ? {
          ...common,
          receiptNumber: formValues.number.trim(),
          receivedFrom: formValues.party.trim(),
          receivedBy: formValues.signedBy.trim(),
        }
      : {
          ...common,
          voucherNumber: formValues.number.trim(),
          paidTo: formValues.party.trim(),
          approvedBy: formValues.signedBy.trim(),
        };

    try {
      await api.post(isIn ? '/receipts' : '/vouchers', payload);
      toast.success(`${isIn ? 'Receipt' : 'Voucher'} saved successfully`);
      handleReset();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Unable to save');
    }
  };

  const getPrintNode = () => previewRef.current?.querySelector('#receipt-print-area');

  const downloadPdf = async () => {
    const node = getPrintNode();
    if (!node) return;
    try {
      await new Promise(requestAnimationFrame);
      await downloadElementAsPDF(node, `${isIn ? 'Receipt' : 'Voucher'}_${liveData.number || 'untitled'}.pdf`);
    } catch {
      toast.error('Unable to generate PDF');
    }
  };

  const printReceipt = async () => {
    await new Promise(requestAnimationFrame);
    window.print();
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="no-print">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">
          {isIn ? 'Cash Receipt (IN)' : 'Cash Receipt (OUT)'}
        </h1>
        <p className="text-sm text-slate-500">
          {isIn ? 'Record money received' : 'Record money paid out'}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 receipt-workspace">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 space-y-4 no-print"
          noValidate
        >
          <Row>
            <Input
              label={isIn ? 'Receipt Number' : 'Voucher Number'}
              error={errors.number?.message}
              {...register('number', { required: 'Number is required', validate: nonBlank('Number') })}
            />
            <Input
              label="Date"
              type="date"
              error={errors.date?.message}
              {...register('date', { required: 'Date is required' })}
            />
          </Row>

          <Input
            label={isIn ? 'Received From' : 'Paid To'}
            error={errors.party?.message}
            {...register('party', { required: 'Party is required', validate: nonBlank('Party') })}
          />
          <Input
            label="Purpose"
            error={errors.purpose?.message}
            {...register('purpose', { required: 'Purpose is required', validate: nonBlank('Purpose') })}
          />

          <Row>
            <Select label="Payment Mode" {...register('paymentMode', { required: 'Payment mode is required' })}>
              {MODES.map((mode) => <option key={mode}>{mode}</option>)}
            </Select>
            <Input
              label="Amount (₹)"
              type="number"
              min="0.01"
              max="999999999.99"
              step="0.01"
              error={errors.amount?.message}
              {...register('amount', {
                required: 'Amount is required',
                valueAsNumber: true,
                validate: (value) => {
                  if (!Number.isFinite(value)) return 'Amount is required';
                  if (value <= 0) return 'Enter an amount greater than zero';
                  if (value > MAX_AMOUNT) return `Amount must be ${MAX_AMOUNT} or less`;
                  return true;
                },
              })}
            />
          </Row>

          <Input label="Amount in Words" readOnly {...register('amountInWords')} />
          <Input
            label={isIn ? 'Received By' : 'Approved By'}
            error={errors.signedBy?.message}
            {...register('signedBy', { required: 'Signatory is required', validate: nonBlank('Signatory') })}
          />

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 pt-2">
            <button type="submit" disabled={isSubmitting} className={primaryButton}>
              <Save size={16} /> {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={printReceipt} className={secondaryButton}>
              <Printer size={16} /> Print
            </button>
            <button type="button" onClick={downloadPdf} className={secondaryButton}>
              <Download size={16} /> PDF
            </button>
            <button type="button" onClick={handleReset} disabled={isSubmitting} className={resetButton}>
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </form>

        <div ref={previewRef} className="receipt-preview rounded-xl">
          <ReceiptTemplate type={type} data={liveData} />
        </div>
      </div>
    </div>
  );
}

const nonBlank = (label) => (value) => value?.trim().length > 0 || `${label} cannot be blank`;

const Row = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
);

const baseInput =
  'mt-1 w-full min-h-11 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm';
const primaryButton =
  'min-h-11 justify-center inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium';
const secondaryButton =
  'min-h-11 justify-center inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium';
const resetButton =
  'min-h-11 justify-center inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-60 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium';

const Input = forwardRef(function Input({ label, error, ...rest }, ref) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input ref={ref} className={`${baseInput} ${error ? 'border-red-500' : ''}`} aria-invalid={Boolean(error)} {...rest} />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
});

const Select = forwardRef(function Select({ label, children, ...rest }, ref) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select ref={ref} className={baseInput} {...rest}>{children}</select>
    </label>
  );
});
