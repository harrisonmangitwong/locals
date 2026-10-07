"""Offline regression tests: no real Apify client is ever constructed."""
import os
import sys
import types
import unittest
from unittest.mock import MagicMock, patch

# Allow offline execution even without the API client installed.
if 'apify_client' not in sys.modules:
    stub = types.ModuleType('apify_client')
    stub.ApifyClient = MagicMock(side_effect=AssertionError('Paid client forbidden'))
    sys.modules['apify_client'] = stub
try:
    import dotenv
except ImportError:
    stub = types.ModuleType('dotenv')
    stub.load_dotenv = lambda: None
    sys.modules['dotenv'] = stub

import scrape_google_maps as maps
import scrape_new_restaurants as monthly


class BudgetTests(unittest.TestCase):
    def client(self, items=()):
        client = MagicMock()
        client.actor.return_value.call.return_value = {'defaultDatasetId': 'offline'}
        client.dataset.return_value.iterate_items.return_value = iter(items)
        return client

    def test_default_discovery_bounds_submission(self):
        client = self.client([{'placeId': 'a'}, {'placeId': 'a'}, {}])
        self.assertEqual(maps.discover_place_ids(client), {'a'})
        payload = client.actor.return_value.call.call_args.kwargs['run_input']
        self.assertEqual(len(payload['searchStringsArray']), 3)
        self.assertEqual(payload['maxCrawledPlacesPerSearch'], 10)
        self.assertFalse(payload['scrapePlaceDetailPage'])
        self.assertEqual(payload['maxReviews'], 0)

    def test_small_and_nondivisible_budgets(self):
        for limit, per in [(1, 20), (25, 10), (7, 3)]:
            client = self.client()
            maps.discover_place_ids(client, per, max_results=limit)
            payload = client.actor.return_value.call.call_args.kwargs['run_input']
            self.assertLessEqual(len(payload['searchStringsArray']) * payload['maxCrawledPlacesPerSearch'], limit)

    def test_zero_and_empty_discovery_make_no_calls(self):
        for kwargs in [dict(max_results=0), dict(max_per_search=0), dict(search_terms=[])]:
            client = self.client()
            self.assertEqual(maps.discover_place_ids(client, **kwargs), set())
            client.actor.assert_not_called()

    def test_invalid_discovery_before_calls(self):
        for kwargs in [dict(max_results=-1), dict(max_per_search=-1), dict(max_results=1.5)]:
            client = self.client()
            with self.assertRaises(ValueError):
                maps.discover_place_ids(client, **kwargs)
            client.actor.assert_not_called()

    def test_monthly_filters_sorts_and_limits_details(self):
        client = self.client()
        with patch.dict(os.environ, {'APIFY_API_TOKEN': 'offline'}, clear=True), \
             patch.object(monthly, 'ApifyClient', return_value=client), \
             patch.object(monthly, 'known_place_ids', return_value={'known'}), \
             patch.object(monthly, 'discover_place_ids', return_value={'known', *map(str, range(20))}) as discover, \
             patch.object(monthly, 'scrape_by_place_ids', return_value=[]) as detail, \
             patch.object(monthly, 'save') as save:
            monthly.main()
            self.assertEqual(len(discover.call_args.kwargs['search_terms']), 3)
            self.assertEqual(discover.call_args.kwargs['max_results'], 30)
            self.assertEqual(detail.call_args.args[1], sorted(map(str, range(20)))[:5])
            self.assertEqual(detail.call_args.kwargs['max_reviews'], 10)
            save.assert_not_called()

    def test_configured_caps_and_data_only_save(self):
        env = {'APIFY_API_TOKEN': 'offline', 'MAX_NEW_PLACES_PER_RUN': '2',
               'MAX_DISCOVERY_SEARCH_TERMS': '1', 'MAX_DISCOVERY_RESULTS_PER_RUN': '4',
               'MAX_DISCOVERY_PLACES_PER_SEARCH': '4', 'MAX_REVIEWS_PER_NEW_PLACE': '0'}
        items = [{'placeId': 'a'}]
        with patch.dict(os.environ, env, clear=True), \
             patch.object(monthly, 'ApifyClient'), \
             patch.object(monthly, 'known_place_ids', return_value=set()), \
             patch.object(monthly, 'discover_place_ids', return_value={'c', 'a', 'b'}) as discover, \
             patch.object(monthly, 'scrape_by_place_ids', return_value=items) as detail, \
             patch.object(monthly, 'build_restaurants_df', return_value='restaurants'), \
             patch.object(monthly, 'build_reviews_df', return_value='reviews'), \
             patch.object(monthly, 'save') as save:
            monthly.main()
            self.assertEqual(discover.call_args.kwargs['max_results'], 4)
            self.assertEqual(len(discover.call_args.kwargs['search_terms']), 1)
            self.assertEqual(detail.call_args.args[1], ['a', 'b'])
            self.assertEqual(detail.call_args.kwargs['max_reviews'], 0)
            save.assert_called_once_with('restaurants', 'reviews', items)

    def test_all_known_skips_details(self):
        with patch.dict(os.environ, {'APIFY_API_TOKEN': 'offline'}, clear=True), \
             patch.object(monthly, 'ApifyClient'), \
             patch.object(monthly, 'known_place_ids', return_value={'a'}), \
             patch.object(monthly, 'discover_place_ids', return_value={'a'}), \
             patch.object(monthly, 'scrape_by_place_ids') as detail:
            monthly.main()
            detail.assert_not_called()

    def test_invalid_configuration_prevents_client_creation(self):
        for raw in ['-1', 'invalid', '1.2']:
            with patch.dict(os.environ, {'MAX_REVIEWS_PER_NEW_PLACE': raw}, clear=True), patch.object(monthly, 'ApifyClient') as client:
                with self.assertRaises(ValueError):
                    monthly.main()
                client.assert_not_called()

    def test_zero_disables_monthly(self):
        for name in ['MAX_NEW_PLACES_PER_RUN', 'MAX_DISCOVERY_RESULTS_PER_RUN', 'MAX_DISCOVERY_SEARCH_TERMS', 'MAX_DISCOVERY_PLACES_PER_SEARCH']:
            with patch.dict(os.environ, {name: '0'}, clear=True), patch.object(monthly, 'ApifyClient') as client:
                monthly.main()
                client.assert_not_called()

    def test_empty_details_and_zero_reviews(self):
        client = self.client()
        self.assertEqual(maps.scrape_by_place_ids(client, []), [])
        client.actor.assert_not_called()
        maps.scrape_by_place_ids(client, ['a'], max_reviews=0)
        self.assertEqual(client.actor.return_value.call.call_args.kwargs['run_input']['maxReviews'], 0)
        frame = maps.build_reviews_df([{'placeId': 'a', 'reviews': []}])
        self.assertTrue(frame.empty)
        self.assertIn('review_id', frame.columns)


if __name__ == '__main__':
    unittest.main()
