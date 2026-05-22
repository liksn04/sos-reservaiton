-- Refresh persisted legal document copy after the Roomin brand rename.
-- Administrator edits are preserved except for exact legacy brand phrases.

update public.legal_documents
set
  title = case
    when title = '서비스이용약관' then 'Roomin 서비스이용약관'
    else replace(title, '빛소리 SOS Reservation', 'Roomin')
  end,
  intro = replace(
    replace(
      intro,
      '빛소리 동아리(이하 "운영자")가 제공하는 합주실 예약 및 동아리 운영 보조 서비스 "빛소리 SOS Reservation"',
      '빛소리 워크스페이스(이하 "운영자")가 제공하는 공간 예약 및 모임 운영 보조 서비스 "Roomin"'
    ),
    '빛소리 SOS Reservation',
    'Roomin'
  ),
  body = replace(
    replace(
      replace(
        replace(
          body,
          '빛소리 SOS Reservation',
          'Roomin'
        ),
        '합주실 예약, 행사 관리, 회비/예산 관리, 회원 관리',
        '공간 예약, 일정 관리, 회비/재정 관리, 회원 운영'
      ),
      '행사·예산 관리',
      '일정·재정 관리'
    ),
    '회비/예산 거래 내역 관리',
    '회비/재정 거래 내역 관리'
  )
where slug = 'terms';

update public.legal_documents
set
  title = case
    when title = '개인정보 처리방침' then 'Roomin 개인정보 처리방침'
    else replace(title, '빛소리 SOS Reservation', 'Roomin')
  end,
  intro = replace(
    replace(
      intro,
      '빛소리 동아리(이하 "운영자")는 「개인정보 보호법」 등 관련 법령을 준수하며, 빛소리 SOS Reservation',
      '빛소리 워크스페이스(이하 "운영자")는 「개인정보 보호법」 등 관련 법령을 준수하며, Roomin'
    ),
    '빛소리 SOS Reservation',
    'Roomin'
  ),
  body = replace(
    replace(
      replace(
        body,
        '빛소리 SOS Reservation',
        'Roomin'
      ),
      '회비/예산 거래 내역',
      '회비/재정 거래 내역'
    ),
    '합주실 예약, 행사, 회비/예산 관리',
    '공간 예약, 일정, 회비/재정 관리'
  )
where slug = 'privacy';
