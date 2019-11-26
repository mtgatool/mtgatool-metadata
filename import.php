<?php

if (!isset($lang)) {
	$lang = 'en';
}

$version = %VERSION%;

$jsonfile = __DIR__.'/'.$version.'/v'.$version.'-'.strtolower($lang).'-database.json';

if (!file_exists($jsonfile)) {
	$lang = "en";
	$jsonfile = __DIR__.'/'.$version.'/v'.$version.'-en-database.json';
}

$database = file_get_contents($jsonfile);

?>