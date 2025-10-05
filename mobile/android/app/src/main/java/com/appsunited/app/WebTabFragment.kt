package com.appsunited.app

import android.graphics.Bitmap
import android.os.Bundle
import android.os.Message
import android.view.*
import android.webkit.*
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment

class WebTabFragment : Fragment() {
    lateinit var webView: WebView
    private var startUrl: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        startUrl = requireArguments().getString("url")!!
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, s: Bundle?): View {
        webView = WebView(requireContext())
        val ws = webView.settings
        ws.javaScriptEnabled = true
        ws.domStorageEnabled = true
        ws.databaseEnabled = true
        ws.setSupportMultipleWindows(true)                 // allow target=_blank
        ws.javaScriptCanOpenWindowsAutomatically = true
        ws.userAgentString = ws.userAgentString + " AU/Android"

        // New windows (target=_blank) -> open new AU tab
        webView.webChromeClient = object : WebChromeClient() {
            override fun onCreateWindow(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message?): Boolean {
                val transport = resultMsg?.obj as WebView.WebViewTransport
                val tmp = WebView(requireContext())
                transport.webView = tmp
                resultMsg?.sendToTarget()
                tmp.webViewClient = object : WebViewClient() {
                    override fun onPageStarted(v: WebView?, url: String?, favicon: Bitmap?) {
                        if (!url.isNullOrBlank()) (activity as MainActivity).openInNewTab(url)
                    }
                }
                return true
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(v: WebView?, req: WebResourceRequest?): Boolean {
                // keep same-tab navigations inside this WebView
                return false
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                (activity as? MainActivity)?.updateTitleForCurrent(url ?: "")
            }
        }

        if (s == null) webView.loadUrl(startUrl)
        return webView
    }

    companion object {
        fun newInstance(url: String) = WebTabFragment().apply {
            arguments = bundleOf("url" to url)
        }
    }
}
