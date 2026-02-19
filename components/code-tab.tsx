'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  NEC_ARTICLES, NEC_CATEGORIES,
  searchArticles, getArticleById,
  type NECArticle,
} from '@/lib/nec-articles'
import {
  getBookmarks, toggleBookmark,
  getRecentArticles, addRecentArticle,
} from '@/lib/storage'
import { toast } from 'sonner'
import {
  Search,
  Star,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  X,
} from 'lucide-react'

export function CodeTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [showBookmarks, setShowBookmarks] = useState(false)

  useEffect(() => {
    setBookmarks(getBookmarks())
    setRecentIds(getRecentArticles())
  }, [])

  const filteredArticles = useMemo(() => {
    let articles = searchQuery ? searchArticles(searchQuery) : NEC_ARTICLES
    if (activeCategory !== 'All') {
      articles = articles.filter(a => a.category === activeCategory)
    }
    return articles
  }, [searchQuery, activeCategory])

  const recentArticles = useMemo(() => {
    return recentIds
      .map(id => getArticleById(id))
      .filter((a): a is NECArticle => a !== undefined)
      .slice(0, 5)
  }, [recentIds])

  const bookmarkedArticles = useMemo(() => {
    return bookmarks
      .map(id => getArticleById(id))
      .filter((a): a is NECArticle => a !== undefined)
  }, [bookmarks])

  function handleToggleBookmark(articleId: string) {
    const isNowBookmarked = toggleBookmark(articleId)
    setBookmarks(getBookmarks())
    toast.success(isNowBookmarked ? 'Bookmarked' : 'Removed bookmark')
  }

  function handleExpandArticle(articleId: string) {
    if (expandedArticle === articleId) {
      setExpandedArticle(null)
    } else {
      setExpandedArticle(articleId)
      addRecentArticle(articleId)
      setRecentIds(getRecentArticles())
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555]" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search NEC articles..."
          className="h-12 w-full border border-[#333] bg-[#111] pl-10 pr-10 text-sm text-[#f0f0f0] placeholder-[#555] focus:border-[#00ff88] focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#f0f0f0]"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category filter + bookmark toggle */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setShowBookmarks(!showBookmarks)}
          className={`flex shrink-0 items-center gap-1 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors ${
            showBookmarks
              ? 'bg-[#ffaa00] text-[#0f1115]'
              : 'border border-[#333] bg-[#111] text-[#888]'
          }`}
        >
          <Star className="h-3 w-3" /> Saved
        </button>
        {['All', ...NEC_CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setShowBookmarks(false) }}
            className={`shrink-0 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors ${
              activeCategory === cat && !showBookmarks
                ? 'bg-[#00ff88] text-[#0f1115]'
                : 'border border-[#333] bg-[#111] text-[#888]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Bookmarked articles */}
      {showBookmarks && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#888]">
            <Star className="h-3.5 w-3.5 text-[#ffaa00]" /> Bookmarked Articles
          </h3>
          {bookmarkedArticles.length === 0 ? (
            <p className="py-4 text-center text-xs text-[#555]">No bookmarked articles yet.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {bookmarkedArticles.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  isExpanded={expandedArticle === article.id}
                  isBookmarked={true}
                  onToggle={() => handleExpandArticle(article.id)}
                  onBookmark={() => handleToggleBookmark(article.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent articles (when no search) */}
      {!showBookmarks && !searchQuery && recentArticles.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#888]">
            <Clock className="h-3.5 w-3.5" /> Recently Viewed
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {recentArticles.map(article => (
              <button
                key={article.id}
                onClick={() => handleExpandArticle(article.id)}
                className="flex shrink-0 flex-col gap-0.5 border border-[#333] bg-[#111] p-2 text-left transition-colors hover:border-[#555]"
                style={{ minWidth: '120px' }}
              >
                <span className="font-mono text-[10px] text-[#00ff88]">{article.number}</span>
                <span className="text-[10px] text-[#ccc]">{article.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Article list */}
      {!showBookmarks && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#888]">
            <BookOpen className="h-3.5 w-3.5" />
            {searchQuery ? `${filteredArticles.length} results` : `${activeCategory} Articles`}
          </h3>
          {filteredArticles.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#555]">No articles found for &quot;{searchQuery}&quot;</p>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredArticles.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  isExpanded={expandedArticle === article.id}
                  isBookmarked={bookmarks.includes(article.id)}
                  onToggle={() => handleExpandArticle(article.id)}
                  onBookmark={() => handleToggleBookmark(article.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Article Card ──────────────────────────

interface ArticleCardProps {
  article: NECArticle
  isExpanded: boolean
  isBookmarked: boolean
  onToggle: () => void
  onBookmark: () => void
}

function ArticleCard({ article, isExpanded, isBookmarked, onToggle, onBookmark }: ArticleCardProps) {
  return (
    <div className={`border bg-[#111] transition-colors ${isExpanded ? 'border-[#00ff88]/30' : 'border-[#222]'}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#00ff88]">{article.number}</span>
            <span className="text-[9px] uppercase tracking-wider text-[#555]">{article.category}</span>
          </div>
          <div className="mt-0.5 text-xs font-medium text-[#f0f0f0]">{article.title}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); onBookmark() }}
            className="shrink-0 transition-colors"
            aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <Star
              className="h-4 w-4"
              fill={isBookmarked ? '#ffaa00' : 'none'}
              stroke={isBookmarked ? '#ffaa00' : '#555'}
            />
          </button>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-[#555]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#555]" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-[#222] px-3 pb-3 pt-2">
          <p className="mb-3 text-xs leading-relaxed text-[#aaa]">{article.summary}</p>

          {/* Key values */}
          {article.keyValues && article.keyValues.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-1">
              {article.keyValues.map((kv, i) => (
                <div key={i} className="flex items-center justify-between border border-[#222] bg-[#0a0b0d] px-2 py-1.5">
                  <span className="text-[10px] text-[#888]">{kv.label}</span>
                  <span className="font-mono text-[10px] font-bold text-[#00ff88]">{kv.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Details */}
          <div className="flex flex-col gap-1.5">
            {article.details.map((detail, i) => (
              <div key={i} className="flex gap-2 text-[11px] leading-relaxed text-[#888]">
                <span className="shrink-0 text-[#555]">{'\u2022'}</span>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
