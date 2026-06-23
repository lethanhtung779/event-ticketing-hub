import * as crypto from 'crypto';

function vnpayUrlEncode(str: string): string {
  return encodeURIComponent(str).replace(/%20/g, '+');
}

export function sortObject(obj: Record<string, string | number | undefined>): Record<string, string> {
  const sorted: Record<string, string> = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      const val = obj[key];
      if (val !== undefined && val !== null) {
        sorted[key] = String(val);
      }
    });
  return sorted;
}

export function buildVnpayPayUrl(params: {
  amount: number;
  orderInfo: string;
  orderRef: string;
  ipAddr: string;
  returnUrl: string;
  tmnCode: string;
  hashSecret: string;
  locale?: string;
  currCode?: string;
}): string {
  const date = new Date();
  const yyyy = date.getFullYear().toString();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const createDate = `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
  const orderId = `${params.orderRef}_${date.getTime()}`;

  const vnpParams: Record<string, string | number | undefined> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: params.tmnCode,
    vnp_Locale: params.locale || 'vn',
    vnp_CurrCode: params.currCode || 'VND',
    vnp_TxnRef: orderId,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: Math.round(params.amount * 100),
    vnp_ReturnUrl: params.returnUrl,
    vnp_CreateDate: createDate,
    vnp_IpAddr: params.ipAddr,
  };

  const sorted = sortObject(vnpParams);
  const signData = Object.entries(sorted)
    .map(([key, val]) => `${key}=${vnpayUrlEncode(String(val))}`)
    .join('&');

  const secureHash = crypto.createHmac('sha512', params.hashSecret).update(signData).digest('hex');

  return `${process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'}?${signData}&vnp_SecureHash=${secureHash}`;
}

export function verifyVnpayCallback(query: Record<string, string>, hashSecret: string): boolean {
  const secureHash = query['vnp_SecureHash'];
  if (!secureHash) return false;

  const params = { ...query };
  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];

  const sorted = sortObject(params);
  const signData = Object.entries(sorted)
    .map(([key, val]) => `${key}=${vnpayUrlEncode(String(val))}`)
    .join('&');

  const computed = crypto.createHmac('sha512', hashSecret).update(signData).digest('hex');
  return computed === secureHash;
}
