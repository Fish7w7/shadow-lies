import React, { useState } from 'react'

interface HomeProps {
  onJoinGame: (username: string) => void
}

export function Home({ onJoinGame }: HomeProps) {
  const [username, setUsername] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim().length >= 3) {
      onJoinGame(username.trim())
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            🎭 Shadow Lies
          </h1>
          <p className="text-xl text-gray-300">Jogo de dedução social</p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Seu nome
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu nickname..."
                maxLength={20}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
              <p className="mt-2 text-sm text-gray-400">
                Mínimo 3 caracteres
              </p>
            </div>

            <button
              type="submit"
              disabled={username.trim().length < 3}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Entrar
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>🎮 Partidas rápidas • 🕵️ Dedução social • 🤖 Totalmente automatizado</p>
        </div>
      </div>
    </div>
  )
}