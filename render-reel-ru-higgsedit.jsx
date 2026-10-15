export default async ({ project, text }) => {
  const p = await project({ size: '1080x1920', fps: 30 });
  const video = await p.add('media/ELAVENE-reel-001-ru-base.mp4');
  const prata = await p.add('fonts/Prata-Regular.ttf');

  p.cut(video, { from: 0, dur: 14, at: 0, fit: 'cover' });

  const addLine = (copy, { at, y, size, dur = 1.75, name }) => {
    p.compose(
      text(copy, {
        x: 36,
        y,
        width: 1008,
        height: size + 18,
        align: 'center',
        fontSize: size,
        color: '#302F2C',
        strokeColor: '#F5F0E8',
        strokeWidth: 1.25,
        typography: { fontAssetId: prata.id, script: 'Cyrl', language: 'ru' },
      }),
      { at, dur, name }
    );
  };

  const addTwoLines = (first, second, at, name, size = 66) => {
    addLine(first, { at, y: 1185, size, name: `${name}-1` });
    addLine(second, { at, y: 1265, size, name: `${name}-2` });
  };

  addTwoLines('Дом не должен', 'быть идеальным.', 0.35, 'caption-home', 66);
  addTwoLines('Уют начинается', 'с ощущений.', 2.55, 'caption-feeling', 66);
  addTwoLines('С уголка, где можно', 'замедлиться.', 4.75, 'caption-reading', 62);
  addTwoLines('Натуральные фактуры', 'добавляют тепла.', 6.95, 'caption-textures', 60);
  addTwoLines('А мягкий свет', 'задаёт настроение.', 9.15, 'caption-light', 64);

  p.compose(
    text('ÉLAVÉNE', {
      x: 36,
      y: 700,
      width: 1008,
      height: 170,
      align: 'center',
      fontSize: 118,
      letterSpacing: 12,
      color: '#302F2C',
      typography: { fontAssetId: prata.id, script: 'Latn', language: 'en' },
    }),
    { at: 11.35, dur: 2.55, name: 'brand-wordmark' }
  );

  p.compose(
    text('Сохраните идею для своего дома.', {
      x: 50,
      y: 890,
      width: 980,
      height: 70,
      align: 'center',
      fontFamily: 'Montserrat',
      fontSize: 42,
      fontWeight: 400,
      color: '#302F2C',
    }),
    { at: 11.55, dur: 2.25, name: 'save-cta' }
  );

  await p.render('renders/ELAVENE-reel-001-ru-animated.mp4', {
    depth: 8,
    bitrate: 8_000_000,
  });
};
