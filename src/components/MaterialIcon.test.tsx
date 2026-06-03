import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MaterialIcon from './MaterialIcon';

describe('MaterialIcon', () => {
  it('renders icon name as data without exposing a text child', () => {
    const html = renderToStaticMarkup(<MaterialIcon name="calendar_month" />);

    expect(html).toContain('class="material-symbols-outlined"');
    expect(html).toContain('data-icon="calendar_month"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('>calendar_month<');
  });

  it('forwards className, style, and safe span props', () => {
    const html = renderToStaticMarkup(
      <MaterialIcon
        name="person"
        className="text-primary"
        id="profile-icon"
        style={{ color: 'red' }}
      />,
    );

    expect(html).toContain('class="material-symbols-outlined text-primary"');
    expect(html).toContain('id="profile-icon"');
    expect(html).toContain('style="color:red"');
  });

  it('supports filled state while preserving caller styles', () => {
    const html = renderToStaticMarkup(
      <MaterialIcon
        name="home"
        filled
        style={{ color: 'blue', fontSize: '20px' }}
      />,
    );

    expect(html).toContain('color:blue');
    expect(html).toContain('font-size:20px');
    expect(html).toContain('font-variation-settings:&#x27;FILL&#x27; 1');
  });
});
