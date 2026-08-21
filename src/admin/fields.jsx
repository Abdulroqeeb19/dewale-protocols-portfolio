import { useRef, useState } from 'react'
import { uploadImage, supabase } from '../lib/supabase'
import Icon from '../components/Icon'

export function Field({ label, value, onChange, type = 'text', placeholder, rows }) {
  const id = useId(label)
  return (
    <div className="admin-field">
      <label htmlFor={id}>{label}</label>
      {type === 'textarea' ? (
        <textarea id={id} rows={rows || 3} value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : type === 'number' ? (
        <input id={id} type="number" value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(Number(e.target.value))} />
      ) : (
        <input id={id} type="text" value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  )
}

let counter = 0
function useId(label) {
  counter += 1
  return `admin-field-${counter}-${label.replace(/[^a-z0-9]/gi, '').slice(0, 12)}`
}

export function SelectField({ label, value, onChange, options }) {
  const id = useId(label)
  return (
    <div className="admin-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>
          Select…
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}

export function ImageField({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      onChange(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="admin-field">
      <label>{label}</label>
      <div className="admin-image">
        <div className={`admin-image-preview ${value ? 'has-image' : ''}`}>
          {value ? <img src={value} alt={label} /> : <Icon name="image" size={22} />}
        </div>
        <div className="admin-image-actions">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} hidden />
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => fileRef.current?.click()} disabled={uploading || !supabase}>
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <input type="text" placeholder="…or paste image URL" value={value || ''} onChange={(e) => onChange(e.target.value)} />
          {value && (
            <button type="button" className="admin-btn admin-btn-danger" onClick={() => onChange(null)}>
              Remove
            </button>
          )}
        </div>
      </div>
      {error && <p className="admin-error">{error}</p>}
      {!supabase && <p className="admin-note">Uploads need Supabase configured — you can still paste a URL.</p>}
    </div>
  )
}

export function FileField({ label, value, onChange, accept = '.pdf' }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      onChange(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="admin-field">
      <label>{label}</label>
      <div className="admin-file">
        <span className={value ? 'admin-file-name' : 'admin-file-empty'}>
          {value ? 'File uploaded ✓' : 'No file uploaded'}
        </span>
        <div className="admin-file-actions">
          <input ref={fileRef} type="file" accept={accept} onChange={handleFile} hidden />
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => fileRef.current?.click()} disabled={uploading || !supabase}>
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <input type="text" placeholder="…or paste file URL" value={value || ''} onChange={(e) => onChange(e.target.value)} />
          {value && (
            <button type="button" className="admin-btn admin-btn-danger" onClick={() => onChange(null)}>
              Remove
            </button>
          )}
        </div>
      </div>
      {error && <p className="admin-error">{error}</p>}
      {!supabase && <p className="admin-note">Uploads need Supabase configured — you can still paste a URL.</p>}
    </div>
  )
}

export function StringListEditor({ label, value = [], onChange }) {
  const update = (next) => onChange(next)
  const setItem = (i, v) => update(value.map((item, idx) => (idx === i ? v : item)))
  const remove = (i) => update(value.filter((_, idx) => idx !== i))
  const add = () => update([...value, ''])

  return (
    <div className="admin-block">
      <div className="admin-block-head">
        <h4>{label}</h4>
        <button type="button" className="admin-btn admin-btn-add" onClick={add}>
          + Add
        </button>
      </div>
      {value.length === 0 && <p className="admin-note">Nothing here yet.</p>}
      {value.map((item, i) => (
        <div className="admin-list-row" key={i}>
          <input type="text" value={item} onChange={(e) => setItem(i, e.target.value)} />
          <button type="button" className="admin-icon-btn" onClick={() => remove(i)} aria-label="Remove">
            <Icon name="trash" size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}

export function ObjectListEditor({ label, value = [], onChange, fields, titleKey, empty }) {
  const update = (next) => onChange(next)
  const setField = (i, key, v) => update(value.map((item, idx) => (idx === i ? { ...item, [key]: v } : item)))
  const remove = (i) => update(value.filter((_, idx) => idx !== i))
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    update(next)
  }
  const add = () => {
    const base = {}
    for (const f of fields) base[f.key] = f.type === 'number' ? 0 : ''
    update([...value, base])
  }

  return (
    <div className="admin-block">
      <div className="admin-block-head">
        <h4>{label}</h4>
        <button type="button" className="admin-btn admin-btn-add" onClick={add}>
          + Add
        </button>
      </div>
      {value.length === 0 && <p className="admin-note">{empty || 'Nothing here yet.'}</p>}
      {value.map((item, i) => (
        <div className="admin-object-card" key={i}>
          <div className="admin-object-head">
            <span className="admin-object-title">
              {titleKey && item[titleKey] ? item[titleKey] : `${label} ${i + 1}`}
            </span>
            <div className="admin-object-tools">
              <button type="button" className="admin-icon-btn" onClick={() => move(i, -1)} aria-label="Move up">
                <Icon name="chevronUp" size={16} />
              </button>
              <button type="button" className="admin-icon-btn" onClick={() => move(i, 1)} aria-label="Move down">
                <Icon name="chevronDown" size={16} />
              </button>
              <button type="button" className="admin-icon-btn admin-icon-danger" onClick={() => remove(i)} aria-label="Remove">
                <Icon name="trash" size={16} />
              </button>
            </div>
          </div>
          <div className="admin-object-body">
            {fields.map((f) =>
              f.type === 'select' ? (
                <SelectField key={f.key} label={f.label} value={item[f.key]} onChange={(v) => setField(i, f.key, v)} options={f.options} />
              ) : f.type === 'textarea' ? (
                <Field key={f.key} label={f.label} type="textarea" value={item[f.key]} onChange={(v) => setField(i, f.key, v)} />
              ) : f.type === 'number' ? (
                <Field key={f.key} label={f.label} type="number" value={item[f.key]} onChange={(v) => setField(i, f.key, v)} />
              ) : f.type === 'image' ? (
                <ImageField key={f.key} label={f.label} value={item[f.key]} onChange={(v) => setField(i, f.key, v)} />
              ) : (
                <Field key={f.key} label={f.label} value={item[f.key]} onChange={(v) => setField(i, f.key, v)} />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
