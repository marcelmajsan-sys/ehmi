'use client'

import { useRef, useState, useTransition } from 'react'
import { useLang } from '@/lib/lang-context'
import type { AppUser } from '@/app/admin/settings/page'

type Props = {
  users: AppUser[]
  addUser: (formData: FormData) => Promise<{ error: string } | undefined>
}

const ROLE_LABELS = {
  admin:   { en: 'Admin',   hr: 'Admin' },
  partner: { en: 'Partner', hr: 'Partner' },
}

const ROLE_DESCRIPTIONS = {
  admin:   { en: 'Full access — all tabs including Users & Settings', hr: 'Puni pristup — svi tabovi uključujući Korisnici i Postavke' },
  partner: { en: 'Data access — Overview & Questions only', hr: 'Pristup podacima — samo Overview i Pitanja' },
}

export function SettingsContent({ users, addUser }: Props) {
  const { lang } = useLang()
  const isEn = lang === 'en'
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await addUser(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(isEn ? 'User created successfully.' : 'Korisnik uspješno kreiran.')
        formRef.current?.reset()
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {isEn ? 'Settings' : 'Postavke'}
      </h1>
      <p className="text-gray-500 mb-8 text-sm">
        {isEn ? 'Manage user access and roles.' : 'Upravljaj korisnicima i ulogama.'}
      </p>

      {/* Add user form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-5">
          {isEn ? 'Add New User' : 'Dodaj novog korisnika'}
        </h2>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isEn ? 'Temporary password' : 'Privremena lozinka'}
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={isEn ? 'min. 8 characters' : 'min. 8 znakova'}
              />
            </div>
          </div>

          {/* Role picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isEn ? 'Role' : 'Uloga'}
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              {(['admin', 'partner'] as const).map(role => (
                <label key={role} className="relative flex items-start gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    defaultChecked={role === 'partner'}
                    className="mt-0.5 accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{ROLE_LABELS[role][lang]}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ROLE_DESCRIPTIONS[role][lang]}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{success}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending
              ? (isEn ? 'Creating…' : 'Kreiram…')
              : (isEn ? 'Create user' : 'Kreiraj korisnika')}
          </button>
        </form>
      </div>

      {/* User list */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">
          {isEn ? `Users (${users.length})` : `Korisnici (${users.length})`}
        </h2>
        <div className="divide-y divide-gray-100">
          {users.map(u => (
            <div key={u.user_id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{u.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(u.created_at).toLocaleDateString(isEn ? 'en-GB' : 'hr-HR')}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                u.role === 'admin'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {ROLE_LABELS[u.role][lang]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
