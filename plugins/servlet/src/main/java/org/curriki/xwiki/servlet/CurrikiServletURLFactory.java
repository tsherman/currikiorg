package org.curriki.xwiki.servlet;

import com.xpn.xwiki.XWikiContext;
import com.xpn.xwiki.web.XWikiServletURLFactory;

import java.net.MalformedURLException;
import java.net.URL;

public class CurrikiServletURLFactory extends XWikiServletURLFactory {


    @Override
    public URL createSkinURL(String filename, String skin, XWikiContext context) {
        URL u = createSkinURLImpl(filename, skin, context);
        //System.err.println("Skin file: " + filename + " requested, responded " + u);
        return u;
    }

    private URL createSkinURLImpl(String filename, String skin, XWikiContext context) {

        if(filename.endsWith("ICTIcon-Activity.gif")) {
            System.out.println("Here!");
        }
        String cdn = context.getWiki().Param("curriki.system.CDN",null);
        StringBuffer newpath = new StringBuffer();
        if(cdn!=null)
            newpath.append(cdn);
        newpath.append('/').append(this.contextPath);
        newpath.append("skins/");
        newpath.append(skin);
        addFileName(newpath, filename, false, context);
        try {
            return new URL(getServerURL(context), newpath.toString());
        } catch (MalformedURLException e) {
            // This should not happen
            return null;
        }
    }

    public java.lang.String getURL(java.net.URL url, com.xpn.xwiki.XWikiContext context) {
        if(url==null) return null;
        return url.toExternalForm();
    }


    /* currently given up
    @Override
    public URL createSkinURL(String filename, String web, String name, String xwikidb, XWikiContext context) {
        StringBuffer newpath = new StringBuffer(this.contextPath);
        addServletPath(newpath, xwikidb, context);
        addAction(newpath, "skin", context);
        addSpace(newpath, web, "skin", context);
        addName(newpath, name, "skin", context);
        addFileName(newpath, filename, false, context);
        try {
            return new URL(getServerURL(xwikidb, context), newpath.toString());
        } catch (MalformedURLException e) {
            // This should not happen
            return null;
        }
    }*/

}
