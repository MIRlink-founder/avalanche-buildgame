import nodemailer from 'nodemailer';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const ACTIVATION_PATH = '/auth/activate';
const INVITATION_PATH = '/auth/invite';
const RESET_PASSWORD_PATH = '/auth/reset-password';

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error(
      'SMTP 설정이 없습니다. SMTP_HOST, SMTP_USER, SMTP_PASS를 확인하세요.',
    );
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export interface SendActivationEmailParams {
  to: string;
  hospitalName: string;
  managerEmail: string;
  approvedAt: Date;
  token: string;
}

// 입점 승인 후 계정 활성화 안내 메일 발송
export async function sendActivationEmail(
  params: SendActivationEmailParams,
): Promise<void> {
  const { to, hospitalName, managerEmail, approvedAt, token } = params;
  const link = `${baseUrl}${ACTIVATION_PATH}?token=${encodeURIComponent(token)}`;
  const approvedAtStr = approvedAt.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <p>안녕하세요, <strong>${hospitalName}</strong> 담당자님. 미르링크(Mirlink)에 입점 신청해 주셔서 진심으로 감사드립니다.</p>
  <p>제출해주신 입점 서류와 정보에 대한 심사가 <strong>[최종 승인]</strong>되었습니다. 현재 귀하의 관리자 계정은 생성되었으나, 보안을 위해 비밀번호 설정 후 활성화가 필요합니다.</p>
  <p>아래 버튼을 클릭하여 비밀번호를 설정하고 서비스를 시작해 보세요.</p>

  <p><strong>[계정 정보 안내]</strong></p>
  <ul>
    <li>병원명: ${hospitalName}</li>
    <li>마스터 계정 ID: ${managerEmail}</li>
    <li>승인 일시: ${approvedAtStr}</li>
  </ul>

  <p><a href="${link}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">계정 활성화 및 비밀번호 설정하기</a></p>
  <p style="font-size: 14px;">또는 아래 링크를 브라우저에 붙여넣기 하세요:<br><a href="${link}">${link}</a></p>

  <p><strong>⚠️ 유의사항</strong></p>
  <ul>
    <li>보안을 위해 위 링크는 발송 후 24시간 동안만 유효합니다.</li>
    <li>유효 시간이 만료된 경우, [비밀번호 찾기] 페이지에서 인증 메일을 다시 요청하실 수 있습니다.</li>
    <li>본인이 신청하지 않은 경우, 즉시 고객센터로 문의해 주시기 바랍니다.</li>
  </ul>
  <p>문의처: help@mirlink.com | 02-1234-5678</p>
</body>
</html>
`;

  const transporter = getTransport();
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject: '[미르링크] 입점 심사가 승인되었습니다. 계정을 활성화해주세요.',
    html,
  });
}

export interface SendRejectionEmailParams {
  to: string;
  hospitalName: string;
  rejectionReason: string;
}

export interface SendResetPasswordEmailParams {
  to: string;
  name?: string | null;
  token: string;
}

export interface SendInvitationEmailParams {
  to: string;
  hospitalName: string;
  invitedBy?: string | null;
  token: string;
  expiresInHours: number;
}

// 비밀번호 재설정 메일 발송
export async function sendResetPasswordEmail(
  params: SendResetPasswordEmailParams,
): Promise<void> {
  const { to, name, token } = params;
  const link = `${baseUrl}${RESET_PASSWORD_PATH}?token=${encodeURIComponent(token)}`;
  const displayName = name?.trim() || '담당자';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <p>안녕하세요, <strong>${displayName}</strong>님.</p>
  <p>미르링크 비밀번호 재설정을 요청하셨습니다. 아래 버튼을 눌러 새 비밀번호를 설정해주세요.</p>

  <p><a href="${link}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">비밀번호 재설정하기</a></p>
  <p style="font-size: 14px;">또는 아래 링크를 브라우저에 붙여넣기 하세요:<br><a href="${link}">${link}</a></p>

  <p><strong>⚠️ 유의사항</strong></p>
  <ul>
    <li>보안을 위해 위 링크는 발송 후 1시간 동안만 유효합니다.</li>
    <li>본인이 요청하지 않았다면 이 메일을 무시해 주세요.</li>
  </ul>
  <p>문의처: help@mirlink.com | 02-1234-5678</p>
</body>
</html>
  `;

  const transporter = getTransport();
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject: '[미르링크] 비밀번호 재설정 안내',
    html,
  });
}

// 병원 직원 초대 메일 발송
export async function sendInvitationEmail(
  params: SendInvitationEmailParams,
): Promise<void> {
  const { to, hospitalName, invitedBy, token, expiresInHours } = params;
  const link = `${baseUrl}${INVITATION_PATH}?token=${encodeURIComponent(token)}`;
  const inviter = invitedBy?.trim() ? invitedBy : '병원 관리자';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <p>안녕하세요.</p>
  <p><strong>${hospitalName}</strong>에서 미르링크 계정으로 초대했습니다.</p>
  <p>아래 버튼을 눌러 비밀번호를 설정하고 계정을 활성화해주세요.</p>

  <p><a href="${link}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">계정 설정하기</a></p>
  <p style="font-size: 14px;">또는 아래 링크를 브라우저에 붙여넣기 하세요:<br><a href="${link}">${link}</a></p>

  <p><strong>⚠️ 유의사항</strong></p>
  <ul>
    <li>보안을 위해 위 링크는 발송 후 ${expiresInHours}시간 동안만 유효합니다.</li>
    <li>본인이 요청하지 않았다면 이 메일을 무시해 주세요.</li>
    <li>초대한 사람: ${inviter}</li>
  </ul>
  <p>문의처: help@mirlink.com | 02-1234-5678</p>
</body>
</html>
  `;

  const transporter = getTransport();
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject: `[미르링크] ${hospitalName}에서 직원 계정을 초대했습니다.`,
    html,
  });
}

// 입점 반려 안내 메일 발송
export async function sendRejectionEmail(
  params: SendRejectionEmailParams,
): Promise<void> {
  const { to, hospitalName, rejectionReason } = params;
  const memoText =
    rejectionReason.trim() ||
    '(반려 사유가 입력되지 않았습니다. 고객센터로 문의해 주세요.)';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <p>안녕하세요, 미르링크(Mirlink) 운영팀입니다.<br>
  미르링크 서비스에 관심을 갖고 입점을 신청해 주셔서 진심으로 감사드립니다.</p>

  <p>보내주신 가입 신청 정보를 검토하였으나,<br>
  아쉽게도 아래와 같은 사유로 인해 승인이 반려(보류)되었음을 안내해 드립니다.</p>

  <p><strong>[반려 사유]</strong></p>
  <pre style="margin: 0; padding: 12px; background: #f5f5f5; border-radius: 6px; white-space: pre-wrap; font-family: inherit;">--------------------------------------------------\n${memoText}\n--------------------------------------------------</pre>

  <p>번거로우시겠지만, 위 사유를 확인하시어 정보를 수정한 후 다시 신청해 주시기 바랍니다.<br>
  재신청 관련 문의는 고객센터로 연락 주시면 빠르고 친절하게 안내해 드리겠습니다.</p>

  <p>감사합니다.<br>미르링크 드림</p>

  <hr style="border: none; border-top: 1px solid #eee;">
  <p style="font-size: 14px; color: #666;">고객센터: 1588-0000 | help@mirlink.com</p>
</body>
</html>
`;

  const transporter = getTransport();
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject: `[Mirlink] ${hospitalName} 가입 신청이 반려되었습니다.`,
    html,
  });
}
