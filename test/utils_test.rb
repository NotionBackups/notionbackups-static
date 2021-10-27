# frozen_string_literal: true

require 'minitest/autorun'

require_relative '../lib/utils'

class UtilsTest < Minitest::Test
  def test_create_canonical_path
    assert_equal '/', create_canonical_path('content/index.html.erb')
    assert_equal '/pricing', create_canonical_path('content/pricing.html.erb')
    assert_equal '/journal/', create_canonical_path('content/journal/index.md')
    assert_equal '/docs/notion-backups', create_canonical_path('content/docs/notion-backups.md')
    assert_equal '/changelog/2020/', create_canonical_path('content/changelog/2020/index.html')
  end
end
