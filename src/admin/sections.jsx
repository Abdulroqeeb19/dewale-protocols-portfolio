import { Field, ImageField, FileField, StringListEditor, ObjectListEditor } from './fields'
import Icon from '../components/Icon'

export const ICON_OPTIONS = ['spark', 'stack', 'cloud', 'pulse', 'layers', 'compass', 'cart', 'bot', 'campus', 'business']
export const SPAN_OPTIONS = ['normal', 'wide', 'tall']
export const CATEGORY_OPTIONS = ['Design', 'Web', 'Apps']
export const CHANNEL_ICON_OPTIONS = ['mail', 'pin', 'phone']

function SubHeading({ children }) {
  return <h3 className="admin-subheading">{children}</h3>
}

export function SettingsEditor({ draft, patch }) {
  const b = draft.brand
  const p = draft.profile
  const setBrand = (key, v) => patch('brand', { ...b, [key]: v })
  const setProfile = (key, v) => patch('profile', { ...p, [key]: v })

  return (
    <>
      <SubHeading>Brand identity</SubHeading>
      <div className="admin-grid-2">
        <Field label="Logo text" value={b.logoText} onChange={(v) => setBrand('logoText', v)} />
        <Field label="Logo mark (short)" value={b.logoMark} onChange={(v) => setBrand('logoMark', v)} />
        <Field label="Hero greeting" value={b.heroGreeting} onChange={(v) => setBrand('heroGreeting', v)} />
        <Field label="Hero accent name" value={b.heroAccent} onChange={(v) => setBrand('heroAccent', v)} />
        <Field label="Hero line 2" value={b.heroLine2} onChange={(v) => setBrand('heroLine2', v)} />
        <Field label="Hero line 3 (role)" value={b.heroLine3} onChange={(v) => setBrand('heroLine3', v)} />
      </div>

      <SubHeading>Profile</SubHeading>
      <div className="admin-grid-2">
        <Field label="Full name" value={p.name} onChange={(v) => setProfile('name', v)} />
        <Field label="Alias / brand name" value={p.alias} onChange={(v) => setProfile('alias', v)} />
        <Field label="Role" value={p.role} onChange={(v) => setProfile('role', v)} />
        <Field label="Hire Me / CTA link (#contact)" value={p.resume} onChange={(v) => setProfile('resume', v)} />
      </div>
      <Field label="Tagline (hero subtitle)" type="textarea" value={p.tagline} onChange={(v) => setProfile('tagline', v)} />

      <SubHeading>Download CV</SubHeading>
      <div className="admin-grid-2">
        <FileField label="CV file (PDF)" value={p.resumeFile} onChange={(v) => setProfile('resumeFile', v)} />
      </div>
      <p className="admin-note">
        Upload your CV PDF and the hero "Download CV" button will download it directly. Leave empty to fall back
        to an auto-generated, printable resume preview.
      </p>

      <SubHeading>Navigation</SubHeading>
      <ObjectListEditor
        label="Nav links"
        value={draft.navLinks}
        onChange={(next) => patch('navLinks', next)}
        fields={[
          { key: 'label', label: 'Label' },
          { key: 'href', label: 'Anchor (#about…)' },
        ]}
        titleKey="label"
      />
    </>
  )
}

export function BrandEditor({ draft, patch }) {
  const b = draft.brand
  const setBrand = (key, v) => patch('brand', { ...b, [key]: v })
  return (
    <>
      <SubHeading>Brand images</SubHeading>
      <div className="admin-grid-2">
        <ImageField label="Logo image (navbar & footer)" value={b.logoImage} onChange={(v) => setBrand('logoImage', v)} />
        <ImageField label="Portrait / profile photo (About)" value={b.portraitImage} onChange={(v) => setBrand('portraitImage', v)} />
      </div>
      <p className="admin-note">
        Leave empty to fall back to the gradient monogram. Images upload to your Supabase Storage bucket.
      </p>
    </>
  )
}

export function ContactsEditor({ draft, patch }) {
  const p = draft.profile
  const setProfile = (key, v) => patch('profile', { ...p, [key]: v })
  return (
    <>
      <SubHeading>Contact details</SubHeading>
      <div className="admin-grid-2">
        <Field label="Email" value={p.email} onChange={(v) => setProfile('email', v)} />
        <Field label="Phone" value={p.phone} onChange={(v) => setProfile('phone', v)} />
        <Field label="Location" value={p.location} onChange={(v) => setProfile('location', v)} />
        <Field label="Website (shown on resume / print)" value={p.website} onChange={(v) => setProfile('website', v)} />
      </div>

      <SubHeading>Social links</SubHeading>
      <ObjectListEditor
        label="Socials"
        value={p.socials}
        onChange={(next) => setProfile('socials', next)}
        fields={[
          { key: 'label', label: 'Label (e.g. GitHub)' },
          { key: 'href', label: 'URL' },
        ]}
        titleKey="label"
      />

      <SubHeading>Contact cards</SubHeading>
      <ObjectListEditor
        label="Contact channels"
        value={draft.contactChannels}
        onChange={(next) => patch('contactChannels', next)}
        fields={[
          { key: 'icon', label: 'Icon', type: 'select', options: CHANNEL_ICON_OPTIONS },
          { key: 'label', label: 'Label' },
          { key: 'value', label: 'Display value' },
          { key: 'href', label: 'Link (mailto:/tel:/#)' },
        ]}
        titleKey="label"
      />
    </>
  )
}

export function FooterEditor({ draft, patch }) {
  const f = draft.footer || {}
  const set = (key, v) => patch('footer', { ...f, [key]: v })
  return (
    <>
      <SubHeading>Footer text</SubHeading>
      <Field label="Footer note (under the logo)" type="textarea" rows={3} value={f.note} onChange={(v) => set('note', v)} />
      <div className="admin-grid-2">
        <Field label="Bottom-right line" value={f.madeWith} onChange={(v) => set('madeWith', v)} />
        <div className="admin-field">
          <label htmlFor="admin-footer-adminlink">Show "Admin" link</label>
          <select id="admin-footer-adminlink" value={String(f.showAdmin)} onChange={(e) => set('showAdmin', e.target.value === 'true')}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>
      <p className="admin-note">
        The copyright line, email address, and logo come from your profile, contacts, and brand images.
      </p>
    </>
  )
}

export function AboutEditor({ draft, patch }) {
  const p = draft.profile
  const setProfile = (key, v) => patch('profile', { ...p, [key]: v })
  return (
    <>
      <SubHeading>About text</SubHeading>
      <Field label="Lead paragraph (bio)" type="textarea" rows={4} value={p.bioLead} onChange={(v) => setProfile('bioLead', v)} />
      <Field label="Secondary paragraph" type="textarea" rows={4} value={p.bioSecondary} onChange={(v) => setProfile('bioSecondary', v)} />

      <SubHeading>Disciplines (highlight cards)</SubHeading>
      <StringListEditor label="Disciplines" value={draft.disciplines} onChange={(next) => patch('disciplines', next)} />

      <SubHeading>Stats counters</SubHeading>
      <ObjectListEditor
        label="Stats"
        value={draft.stats}
        onChange={(next) => patch('stats', next)}
        fields={[
          { key: 'value', label: 'Target number', type: 'number' },
          { key: 'suffix', label: 'Suffix (e.g. +)' },
          { key: 'label', label: 'Label' },
        ]}
        titleKey="label"
      />
    </>
  )
}

export function ServicesEditor({ draft, patch }) {
  return (
    <ObjectListEditor
      label="Services"
      value={draft.services}
      onChange={(next) => patch('services', next)}
      fields={[
        { key: 'icon', label: 'Icon', type: 'select', options: ICON_OPTIONS },
        { key: 'title', label: 'Title' },
        { key: 'desc', label: 'Description', type: 'textarea' },
        { key: 'span', label: 'Card size', type: 'select', options: SPAN_OPTIONS },
      ]}
      titleKey="title"
      empty="No services yet — add your first one."
    />
  )
}

export function SkillsEditor({ draft, patch }) {
  const skills = draft.skills
  const setItem = (gi, itemI, key, v) => {
    const next = skills.map((g, idx) =>
      idx === gi ? { ...g, items: g.items.map((it, j) => (j === itemI ? { ...it, [key]: v } : it)) } : g
    )
    patch('skills', next)
  }
  const removeItem = (gi, itemI) => {
    const next = skills.map((g, idx) => (idx === gi ? { ...g, items: g.items.filter((_, j) => j !== itemI) } : g))
    patch('skills', next)
  }
  const addItem = (gi) => {
    const next = skills.map((g, idx) => (idx === gi ? { ...g, items: [...g.items, { name: '', level: 80 }] } : g))
    patch('skills', next)
  }
  const setGroupName = (gi, v) => patch('skills', skills.map((g, idx) => (idx === gi ? { ...g, group: v } : g)))
  const removeGroup = (gi) => patch('skills', skills.filter((_, idx) => idx !== gi))
  const addGroup = () => patch('skills', [...skills, { group: '', items: [{ name: '', level: 80 }] }])

  return (
    <div className="admin-block">
      <div className="admin-block-head">
        <h4>Skill groups</h4>
        <button type="button" className="admin-btn admin-btn-add" onClick={addGroup}>
          + Add group
        </button>
      </div>
      {skills.map((group, gi) => (
        <div className="admin-object-card" key={gi}>
          <div className="admin-object-head">
            <input
              className="admin-object-title-input"
              type="text"
              value={group.group}
              placeholder="Group name (e.g. Backend & Systems)"
              onChange={(e) => setGroupName(gi, e.target.value)}
            />
            <button type="button" className="admin-icon-btn admin-icon-danger" onClick={() => removeGroup(gi)} aria-label="Remove group">
              <IconTrash />
            </button>
          </div>
          <div className="admin-object-body">
            {group.items.map((item, itemI) => (
              <div className="admin-skill-row" key={itemI}>
                <input
                  type="text"
                  value={item.name}
                  placeholder="Skill name"
                  onChange={(e) => setItem(gi, itemI, 'name', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={item.level}
                  onChange={(e) => setItem(gi, itemI, 'level', Number(e.target.value))}
                />
                <span className="admin-skill-pct">%</span>
                <button type="button" className="admin-icon-btn" onClick={() => removeItem(gi, itemI)} aria-label="Remove skill">
                  <IconTrash />
                </button>
              </div>
            ))}
            <button type="button" className="admin-btn admin-btn-ghost" onClick={() => addItem(gi)}>
              + Add skill
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function IconTrash() {
  return <Icon name="trash" size={16} />
}

export function ExperienceEditor({ draft, patch }) {
  return (
    <ObjectListEditor
      label="Experience entries"
      value={draft.timeline}
      onChange={(next) => patch('timeline', next)}
      fields={[
        { key: 'year', label: 'Period (e.g. 2022 — 2024)' },
        { key: 'role', label: 'Role' },
        { key: 'company', label: 'Company' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ]}
      titleKey="role"
      empty="No experience yet — add your first entry."
    />
  )
}

export function PortfolioEditor({ draft, patch }) {
  const categories = draft.projectCategories.filter((c) => c !== 'All')
  return (
    <>
      <SubHeading>Categories</SubHeading>
      <StringListEditor label="Filter categories (All is automatic)" value={categories} onChange={(next) => patch('projectCategories', ['All', ...next])} />

      <SubHeading>Projects</SubHeading>
      <ObjectListEditor
        label="Portfolio cards"
        value={draft.projects}
        onChange={(next) => patch('projects', next)}
        fields={[
          { key: 'title', label: 'Title' },
          { key: 'category', label: 'Category', type: 'select', options: categories.length ? categories : CATEGORY_OPTIONS },
          { key: 'tag', label: 'Tag (small label)' },
          { key: 'image', label: 'Card image', type: 'image' },
          { key: 'grad', label: 'Fallback gradient (CSS)' },
          { key: 'desc', label: 'Description', type: 'textarea' },
        ]}
        titleKey="title"
        empty="No projects yet — add your first card."
      />
      <p className="admin-note">Tip: upload an image per card, or set a CSS gradient like linear-gradient(135deg, #66fcf1, #7a5cff).</p>
    </>
  )
}
