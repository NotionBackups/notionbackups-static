# frozen_string_literal: true

# Remove the .html extension from sitemap and feed URLs

require 'nokogiri'

begin
  sitemap_xml = File.read('output/sitemap.xml')
  sitemap_doc = Nokogiri::XML(sitemap_xml)

  locs = sitemap_doc.xpath('/ns:urlset/ns:url/ns:loc', 'ns' => 'http://www.sitemaps.org/schemas/sitemap/0.9')
  locs.each { |loc| loc.content = loc.content.gsub(/.html/, '') }

  File.write('output/sitemap.xml', sitemap_doc.to_xml)

  atom_xml = File.read('output/guides/feed.xml')
  atom_doc = Nokogiri::XML(atom_xml)

  hrefs = atom_doc.xpath('/ns:feed/ns:entry/ns:link[@rel="alternate"]', 'ns' => "http://www.w3.org/2005/Atom")
  hrefs.each { |href| href.set_attribute("href", href.attr("href").gsub(/.html/, '')) }

  File.write('output/guides/feed.xml', atom_doc.to_xml)
rescue SystemCallError => e
  puts e.message
end
