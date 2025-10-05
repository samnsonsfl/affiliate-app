package com.appsunited.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.setPadding
import androidx.fragment.app.Fragment
import java.util.*

data class Tab(val id: String, var title: String, val url: String)

class MainActivity : AppCompatActivity() {
    private val tabs = mutableListOf<Tab>()
    private var activeId: String? = null
    private lateinit var tabStrip: LinearLayout

    // 👉 Set this to your live launcher URL (Netlify/GitHub Pages)
    private val LAUNCHER_URL = "https://YOUR-LAUNCHER-URL"

    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.Theme_AppsUnited)
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        tabStrip = findViewById(R.id.tabStrip)

        // First tab: your launcher
        openInNewTab(LAUNCHER_URL, "Launcher")
    }

    /* ---------- Tabs API ---------- */

    fun openInNewTab(url: String, titleFallback: String = "Loading…") {
        val id = System.currentTimeMillis().toString(36) + UUID.randomUUID().toString().substring(0, 5)
        val t = Tab(id, titleFallback, url)
        tabs.add(t)

        val frag = WebTabFragment.newInstance(url)
        showFragment(frag, id)
        activeId = id
        renderTabStrip()
        invalidateOptionsMenu()
    }

    private fun showFragment(f: Fragment, tag: String) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.tabContainer, f, tag)
            .commitNow()
    }

    private fun getActiveFragment(): WebTabFragment? {
        val id = activeId ?: return null
        val frag = supportFragmentManager.findFragmentByTag(id)
        return frag as? WebTabFragment
    }

    private fun activate(id: String) {
        val frag = supportFragmentManager.findFragmentByTag(id) ?: return
        showFragment(frag, id)
        activeId = id
        renderTabStrip()
        invalidateOptionsMenu()
    }

    private fun closeTab(id: String) {
        val idx = tabs.indexOfFirst { it.id == id }
        if (idx == -1) return
        supportFragmentManager.findFragmentByTag(id)?.let {
            supportFragmentManager.beginTransaction().remove(it).commitNowAllowingStateLoss()
        }
        tabs.removeAt(idx)
        activeId = tabs.getOrNull((idx - 1).coerceAtLeast(0))?.id
        activeId?.let { activate(it) } ?: run { renderTabStrip(); invalidateOptionsMenu() }
    }

    fun updateTitleForCurrent(currentUrl: String) {
        val id = activeId ?: return
        val t = tabs.find { it.id == id } ?: return
        // Use host as fallback label
        t.title = try { Uri.parse(currentUrl).host ?: t.title } catch (_: Exception) { t.title }
        renderTabStrip()
    }

    private fun renderTabStrip() {
        tabStrip.removeAllViews()
        for (t in tabs) {
            val pill = TextView(this).apply {
                text = (if (t.id == activeId) "• " else "") + (t.title.ifBlank { hostOf(t.url) })
                setPadding(24)
                setOnClickListener { activate(t.id) }
                setOnLongClickListener { closeTab(t.id); true }
                setBackgroundColor(if (t.id == activeId) getColor(R.color.tabActive) else getColor(R.color.tabBg))
            }
            tabStrip.addView(pill)
        }
    }

    private fun hostOf(url: String): String =
        runCatching { Uri.parse(url).host ?: "Tab" }.getOrDefault("Tab")

    /* ---------- App bar menu: Back / Forward / Share / Open in Chrome ---------- */

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menu.add(0, 1, 0, R.string.menu_back)
        menu.add(0, 2, 1, R.string.menu_forward)
        menu.add(0, 3, 2, R.string.menu_share)
        menu.add(0, 4, 3, R.string.menu_open_in_chrome)
        return true
    }

    override fun onPrepareOptionsMenu(menu: Menu): Boolean {
        val wv = getActiveFragment()?.webView
        menu.findItem(1)?.isEnabled = wv?.canGoBack() == true
        menu.findItem(2)?.isEnabled = wv?.canGoForward() == true
        val hasTab = activeId != null
        menu.findItem(3)?.isEnabled = hasTab
        menu.findItem(4)?.isEnabled = hasTab
        return super.onPrepareOptionsMenu(menu)
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        val wv = getActiveFragment()?.webView
        return when (item.itemId) {
            1 -> { if (wv?.canGoBack() == true) wv.goBack(); true }
            2 -> { if (wv?.canGoForward() == true) wv.goForward(); true }
            3 -> { shareCurrent(); true }
            4 -> { openInChrome(); true }
            else -> super.onOptionsItemSelected(item)
        }
    }

    private fun shareCurrent() {
        val id = activeId ?: return
        val t = tabs.find { it.id == id } ?: return
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, t.url)
        }
        startActivity(Intent.createChooser(intent, getString(R.string.menu_share)))
    }

    private fun openInChrome() {
        val id = activeId ?: return
        val t = tabs.find { it.id == id } ?: return
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(t.url))
        startActivity(intent)
    }
}
